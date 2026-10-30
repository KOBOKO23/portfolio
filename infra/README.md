# Portfolio backend hosting (AWS, ~USD 12/month)

One EC2 **t4g.micro** (Ubuntu 24.04 arm64, eu-west-1) runs everything for
`api.koboko.co.ke`:

```
Internet ─ 80/443 ─► nginx + Let's Encrypt ─► koboko-backend container (127.0.0.1:8001, gunicorn ×2)
                                                    │
                     PostgreSQL 16 (localhost) ◄────┘   S3 media bucket, SES via instance role
                     nightly pg_dump ─► s3://koboko-portfolio-backups-<account>/pg/ (30-day expiry)
```

The front end stays on Vercel. The image is built by CI and stored in ECR
(`koboko-backend`). Secrets stay in Secrets Manager (`koboko/backend`); the
local database password lives only on the host in `/etc/koboko/db.env` and
overrides the secret's old `DATABASE_URL`. No AWS access keys anywhere: the
host uses its instance role.

| Item | USD / month |
|---|---|
| EC2 t4g.micro | ~6.70 |
| EBS gp3 16 GiB | ~1.40 |
| Elastic IP | ~3.65 |
| S3 backups | ~0.05 |
| **Total** | **~11.80** |

## Scripts

All are idempotent and **dry run by default** (`DRY_RUN=false` to apply). The
laptop scripts use the `nyumbascout` AWS CLI profile (IAM user, not root).

| Script | Where | What |
|---|---|---|
| `infra/aws/provision.sh` | laptop | Security group, backup bucket, IAM role, key pair, EC2, Elastic IP |
| `infra/aws/run_on_host.sh <script> [K=v]` | laptop | Runs a script on the host as root via SSM — no SSH needed |
| `infra/host/setup.sh` | host | Swap, Docker, nginx, certbot, PostgreSQL, systemd units, `koboko-deploy`, `koboko-pg-backup` |
| `infra/aws/restore_blog_db.sh` | laptop | Restores the final `koboko-db` snapshot to a temporary RDS, copies it into the host's database, deletes the temporary RDS |
| `infra/aws/ci_role.sh` | laptop | Lets GitHub Actions deploy via a fixed SSM document instead of ECS |
| `infra/aws/decommission_ecs.sh` | laptop | Removes the old ECS/ALB/CloudFront hosting — refuses until DNS points at the new host and it is healthy |

## First-time setup (the migration from ECS)

```bash
DRY_RUN=false bash infra/aws/provision.sh                                  # prints the Elastic IP
bash infra/aws/run_on_host.sh infra/host/setup.sh DRY_RUN=false            # cert step waits for DNS
DRY_RUN=false bash infra/aws/restore_blog_db.sh                            # blog back from snapshot
bash infra/aws/run_on_host.sh /dev/stdin <<<'koboko-deploy'                # pull, migrate, start
```

Then in **Vercel → Domains → koboko.co.ke → DNS**: replace the `api` CNAME
(`d3w25olejwyxyw.cloudfront.net`) with an **A record → the Elastic IP**. Once
`dig +short api.koboko.co.ke` shows it:

```bash
bash infra/aws/run_on_host.sh infra/host/setup.sh DRY_RUN=false   # issues the certificate
curl -s https://api.koboko.co.ke/api/health/                       # {"status":"ok","db":true}
DRY_RUN=false bash infra/aws/ci_role.sh
DRY_RUN=false bash infra/aws/decommission_ecs.sh
```

## Day to day

- **Deploy:** push to `production`; CI builds the image and runs the
  `koboko-portfolio-deploy` SSM document (= `koboko-deploy` on the host).
  By hand: `bash infra/aws/run_on_host.sh /dev/stdin <<<'koboko-deploy'`.
- **Change a secret:** edit `koboko/backend` in Secrets Manager, then deploy
  (koboko-deploy re-renders `/etc/koboko/backend.env`).
- **Logs:** `journalctl -u koboko-backend -f` (via SSM Session Manager or SSH).
- **Backup now:** `sudo systemctl start koboko-pg-backup`. Restore:
  download the dump from the backups bucket on the laptop, copy it over, then
  `sudo -u postgres pg_restore --clean --no-owner --role=koboko -d koboko <file>`.
- **Your IP changed (SSH):** re-run `provision.sh`, or use SSM Session Manager.
