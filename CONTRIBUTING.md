# Contributing

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

| Commit type | Semver bump | Example |
|-------------|-------------|---------|
| `feat:`     | **minor** (0.x.0) | `feat: add /greet endpoint` |
| `fix:`      | **patch** (0.0.x) | `fix: handle empty name after trim` |
| `BREAKING CHANGE:` (footer) | **major** (x.0.0) | `feat!: rename greeting field` |
| `chore:`, `docs:`, `test:`, `ci:`, `refactor:` | none | `chore: update devbox packages` |

## Branch Strategy

- Work on feature branches (`feat/`, `fix/`, `chore/`)
- Open PRs to `main`
- Squash-merge to `main` with a Conventional Commit title
- Tags (`v0.1.0`) are created by the release skill on `main`

## Local Development

```bash
devbox shell           # enter devbox environment
devbox run test        # run tests
devbox run lint        # run linter
devbox run lint-fix    # auto-fix lint errors
devbox run security    # run security scans
devbox run image-build # build Docker image
devbox run image-scan  # Trivy image scan
```
