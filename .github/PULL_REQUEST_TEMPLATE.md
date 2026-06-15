## Summary

<!-- One paragraph describing what this PR changes and why. -->

## Type of change

- [ ] Bug fix (`fix:`)
- [ ] New feature (`feat:`)
- [ ] Refactor (`refactor:`)
- [ ] Documentation (`docs:`)
- [ ] CI/CD (`ci:`)
- [ ] Chore / tooling (`chore:`)
- [ ] Breaking change (add `!` after type: `feat!:`)

## Related issues

<!-- Closes #<issue number> or N/A -->

## What was tested

<!-- Describe what you ran to verify the change. -->

- [ ] `./scripts/test.sh` — all tests pass
- [ ] `./scripts/lint.sh` — no lint errors
- [ ] Manual smoke test in the browser (for frontend changes)
- [ ] `./scripts/deploy-check.sh` — all checks pass (for deploy-path changes)

## Screenshots

<!-- For UI changes, include before/after screenshots. Delete this section if not applicable. -->

## Checklist

- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] New endpoints are documented in `docs/api-reference.md`
- [ ] New environment variables are added to the relevant `.env.example`
- [ ] Database migrations are included and reversible
- [ ] No secrets, credentials, or `.env` files are committed
- [ ] `CHANGELOG.md` updated under `[Unreleased]` if this is a user-facing change
