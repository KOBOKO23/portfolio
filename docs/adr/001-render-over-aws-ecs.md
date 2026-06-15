# ADR 001 — Render over AWS ECS for Backend Hosting

**Status:** Accepted  
**Date:** 2026-06-15  
**Author:** Philip Oduya

---

## Context

The portfolio backend needed a production hosting platform. The initial implementation used AWS ECS (Elastic Container Service) with Fargate, ECR for container images, and RDS for PostgreSQL. This required:

- AWS IAM roles, OIDC identity providers, and an ECS task definition
- A Docker image build + push step in CI
- A `deploy-backend.yml` workflow with ~90 lines of AWS-specific configuration
- `scripts/aws_deploy.sh` and `scripts/aws_infra_setup.sh` totalling over 690 lines

The AWS stack worked correctly but introduced significant operational complexity for a personal portfolio project.

## Decision

Switch the backend hosting from AWS ECS to **Render**.

Deploy using Render's native build system (not Docker) via a `render.yaml` Blueprint file. PostgreSQL is provisioned as a Render-managed add-on with `DATABASE_URL` injected automatically.

## Rationale

| Dimension | AWS ECS | Render |
|-----------|---------|--------|
| Infrastructure definition | ECS task definitions, IAM policies, ECR repositories | Single `render.yaml` file |
| Deploy trigger | GitHub Actions builds Docker image → ECR → ECS service update | Render deploy hook (one HTTP call) |
| Database | RDS provisioned separately, connection string managed manually | Managed PostgreSQL add-on; `DATABASE_URL` injected automatically |
| SSL | ACM certificates + ALB configuration | Automatic per-subdomain |
| Cold-start | ~60–90s ECS task replacement | ~30s (no Docker pull overhead) |
| Monthly cost at low traffic | ~$40+ (ECS + RDS + ALB) | $0–$7 (free tier covers this project's traffic) |
| Operational knowledge required | IAM, VPCs, task definitions, ECS service rolling updates | None beyond reading the dashboard |

For a personal portfolio with one developer and unpredictable but low traffic, the Render model eliminates the operational overhead without sacrificing reliability.

## Consequences

**Positive:**
- Deleted ~690 lines of AWS infrastructure scripts
- Reduced `deploy-production.yml` to a single `curl` call to the deploy hook
- `render.yaml` is readable and deployable from scratch in under 5 minutes
- `DATABASE_URL` pattern is 12-factor compliant and makes the database config portable

**Negative / Trade-offs:**
- Render's free tier suspends idle services after 15 minutes (first request after suspension has ~10s cold start). The paid tier ($7/month) eliminates this.
- Render Disk is not replicated. A disk failure would lose media files not backed up to S3.
- Less control over the runtime environment vs. a custom Docker image.

## Migration notes

The application uses `dj-database-url` to parse `DATABASE_URL` and falls back to individual `DB_*` variables for local development. See [ADR 002](002-database-url-twelve-factor.md) for the database configuration decision.
