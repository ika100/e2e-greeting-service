# ADR-0008: Semver + Conventional Commits + Automated CHANGELOG

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, references/release-management.md

## Context

The greeting-service is versioned and released as a Docker image pushed to
`ghcr.io/ika100/e2e-greeting-service`. Downstream consumers (frontend service, GitOps repo)
pin to a specific image tag. A clear versioning and changelog strategy is required.

## Decision

We will use **Semantic Versioning (SemVer 2.0.0)** driven by **Conventional Commits** on
`main`. The release skill automates:
1. Determining the next version from commits since last tag.
2. Updating `CHANGELOG.md` (Keep a Changelog format).
3. Bumping `version` in `openspec/project.md` and `package.json`.
4. Creating a `v<semver>` git tag.
5. Building and pushing the Docker image with `:<version>` and `:latest` tags.
6. Opening a PR in `ika100/e2e-gitops` to update `apps/greeting-service/values.yaml`.

## Alternatives Considered

- **CalVer** — date-based; doesn't communicate breaking vs. patch changes to consumers.
  Rejected.
- **Manual versioning** — error-prone; doesn't integrate with the release skill. Rejected.
- **commitlint enforcement** — useful for large teams; for this project, conventional
  commits are enforced by agent convention, not a git hook. Revisit if human contributors
  are added.

## Consequences

**Positive**
- CHANGELOG.md is auto-generated from conventional commit types → low maintenance.
- Semver communicates API stability to frontend and GitOps consumers.
- Docker image tags are deterministic (`:<version>`) — easy to pin and roll back.
- GitOps PR automation closes the deployment loop: tag → image push → values.yaml PR.

**Negative / trade-offs**
- Relies on squash-commit messages following Conventional Commits format. Build agents
  enforce this; human contributors must be briefed.

**Neutral / follow-ups**
- Start at `v0.1.0` (initial development, API may change).
- Promote to `v1.0.0` when the API is considered stable.
- Pre-release tags (`v0.2.0-alpha.1`) supported by the CI pipeline `prerelease` flag.
