# CI/CD Pipeline Design — greeting-service

> **ADRs:** ADR-0005 (GitHub Actions), ADR-0006 (branch strategy), ADR-0007 (security scanning),
> ADR-0008 (release strategy), ADR-0009 (devbox)

---

## Overview

The pipeline covers the full SDLC for a **microservice** project:

```
PR / push to main
       │
       ├──► [security] CodeQL SAST + Trivy FS + Gitleaks + npm audit
       │
       ├──► [test]     lint + node --test
       │
       └──► [build]    Docker image build → push sha-tag (main only)
                              │
                              └──► [release] (on v* tag only)
                                     Docker :version + :latest push
                                     GitHub Release creation
                                           │
                                           └──► [gitops-update]
                                                  PR in ika100/e2e-gitops
                                                  updating apps/greeting-service/values.yaml
```

---

## Branch Strategy

| Branch pattern | Purpose | Merges into |
|----------------|---------|-------------|
| `main` | Integration branch; always deployable | — |
| `task/T-NNN-<slug>` | One branch per coding task (worktree) | `main` via PR (squash) |
| `chore/setup-<timestamp>` | Foundational serial tasks | `main` via PR |
| `hotfix/T-NNN-<slug>` | Post-release fixes | `main` via PR |
| `release/v<semver>` | Release prep | `main` via PR + tag |

**Branch protection on `main`:**
- Require PR before merging (no direct push)
- Required status checks: `CI / Security`, `CI / Test`
- Require branches to be up to date
- Delete branch on merge

---

## Pipeline Stages

### Stage 1 — Security (blocks PR merge and release)

Runs on every PR and push to `main`.

| Step | Tool | Severity gate | Output |
|------|------|--------------|--------|
| CodeQL SAST | `github/codeql-action` | CRITICAL, HIGH → fail | SARIF → GitHub Security tab |
| Dependency scan (filesystem) | `aquasecurity/trivy-action` (fs) | CRITICAL, HIGH → fail | SARIF → GitHub Security tab |
| Secrets scan | `gitleaks detect` via `devbox run security` | Any secret → fail | Console |
| npm audit | `npm audit --audit-level=high` via `devbox run security` | HIGH, CRITICAL → fail | Console |

### Stage 2 — Test (blocks PR merge)

Runs on every PR and push to `main`.

| Step | Command | Gate |
|------|---------|------|
| Lint | `devbox run lint` | Any eslint warning → fail |
| Unit + integration tests | `devbox run test` | Any test failure → fail |
| Coverage upload | `actions/upload-artifact` | Informational |

### Stage 3 — Build (runs after security + test pass)

| Trigger | Action |
|---------|--------|
| Pull request | Build image only (no push) — validates Dockerfile |
| Push to `main` | Build + push with `sha-<SHA>` and `main` tags |
| `v*` tag | Build + push handled in Release stage |

Container scan runs after build:

| Step | Tool | Gate |
|------|------|------|
| Container CVE scan | `aquasecurity/trivy-action` (image) | CRITICAL, HIGH → fail |

### Stage 4 — Release (triggered by `v*` tags only)

Runs after security, test, and build all pass.

| Step | Description |
|------|-------------|
| Build + push Docker image | Tags: `:<version>`, `:latest` |
| Create GitHub Release | Uses `.release-notes.md` (written by release skill) |

### Stage 5 — GitOps Update (triggered after release)

| Step | Description |
|------|-------------|
| Checkout `ika100/e2e-gitops` | Via `GITOPS_PAT` secret |
| Update `apps/greeting-service/values.yaml` | `yq e -i ".image.tag = \"<version>\""` |
| Open PR in gitops repo | Via `peter-evans/create-pull-request` |

---

## Security Gates Summary

| Gate | Blocks PR merge | Blocks Release | Tool |
|------|:--------------:|:--------------:|------|
| SAST CRITICAL/HIGH | ✅ | ✅ | CodeQL |
| Dependency CRITICAL/HIGH CVE | ✅ | ✅ | Trivy (fs) + npm audit |
| Secrets detected | ✅ | ✅ | Gitleaks |
| Container CRITICAL/HIGH CVE | ❌ (no image on PR) | ✅ | Trivy (image) |

---

## Secrets Required

| Secret | Used for | Where to configure |
|--------|----------|--------------------|
| `GITHUB_TOKEN` | Automatic — image push to ghcr.io, SARIF upload, GitHub Release | GitHub auto-provided |
| `GITOPS_PAT` | Checkout + PR in `ika100/e2e-gitops` | Repo → Settings → Secrets |
| `GITOPS_REPO` | GitOps repo name (`ika100/e2e-gitops`) | Repo → Settings → Secrets |

| Variable | Value | Where to configure |
|----------|-------|--------------------|
| `GITOPS_VALUES_PATH` | `apps/greeting-service/values.yaml` | Repo → Settings → Variables |

---

## Release Strategy

- **Versioning:** SemVer 2.0.0 — `MAJOR.MINOR.PATCH`
- **Start version:** `0.1.0`
- **Trigger:** Release skill creates tag `v<semver>` on `main` after all waves complete.
- **Version bump rules** (from conventional commits since last tag):

| Commit type | Bump |
|-------------|------|
| `BREAKING CHANGE` footer | major |
| `feat:` | minor |
| `fix:`, `perf:`, `security:` | patch |
| `refactor:`, `chore:`, `ci:`, `docs:`, `test:` | none |

- **Docker tags on release:** `:<version>` (e.g., `0.1.0`) and `:latest`.
- **Pre-release:** `v0.2.0-alpha.1` → CI sets `prerelease: true` on GitHub Release; `:latest` NOT updated.
- **CHANGELOG:** Keep-a-Changelog format; auto-generated by release skill.

---

## GitHub Actions Workflow Template

The file `.github/workflows/ci.yml` is generated from the microservice template
(`assets/github-actions-microservice.yml`) with these customisations:

```yaml
env:
  REGISTRY:   ghcr.io
  IMAGE_NAME: ghcr.io/ika100/e2e-greeting-service

# CodeQL language: javascript
# devbox run scripts: test, lint, security, image-build, image-scan
# GITOPS_VALUES_PATH variable: apps/greeting-service/values.yaml
```

See `planning/task-plan.md` → T-CI-001 for the full adapted workflow content.

---

## Local Development Flow

```bash
# Enter devbox shell (all tools available)
devbox shell

# Run tests
devbox run test

# Lint
devbox run lint

# Security scan
devbox run security

# Build image locally
devbox run image-build

# Scan local image
devbox run image-scan
```

---

## Devbox + CI Integration

All CI jobs use `jetify-com/devbox-install-action@v0.4.0` with `enable-cache: true`.
This restores the Nix package cache (~5 s warm, ~30 s cold). No language-specific setup
actions (`actions/setup-node`) are used — devbox is the single source of truth for tool versions.
