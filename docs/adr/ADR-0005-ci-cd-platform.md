# ADR-0005: GitHub Actions as CI/CD Platform

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, docs/ci-cd.md

## Context

The greeting-service lives in a GitHub repository (`ika100/e2e-greeting-service`). A CI/CD
pipeline is required to automate testing, security scanning, Docker image building, and
GitOps updates. The platform uses GitHub for source control and `ghcr.io` for the container
registry.

## Decision

We will use **GitHub Actions** as the sole CI/CD platform, using the standard
`github-actions-microservice.yml` template.

## Alternatives Considered

- **GitLab CI** — excellent, but the project is hosted on GitHub; using GitLab would require
  mirroring and adds unnecessary complexity.
- **CircleCI / Jenkins** — additional infrastructure or SaaS cost; no benefit over GitHub
  Actions for a GitHub-hosted project.
- **Tekton (in-cluster)** — powerful for Kubernetes-native CI, but too much operational
  overhead for a single microservice.

## Consequences

**Positive**
- Native integration with GitHub (PRs, security tab, SARIF uploads, packages/registry).
- `GITHUB_TOKEN` provides automatic authentication to `ghcr.io` — no extra secrets for image push.
- CodeQL is a first-class GitHub Actions integration (GitHub Advanced Security).
- `jetify-com/devbox-install-action` handles reproducible tool installation from `devbox.lock`.
- Free for public repositories; generous limits for private.

**Negative / trade-offs**
- Vendor lock-in to GitHub's CI infrastructure. Acceptable given the platform is GitHub-native.
- GitHub Actions YAML can become complex; mitigated by using a standardised template.

**Neutral / follow-ups**
- Workflow file lives at `.github/workflows/ci.yml`.
- Branch protection rules enforce CI gates before merge (see `docs/ci-cd.md`).
