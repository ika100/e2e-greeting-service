# ADR-0009: Devbox for Reproducible Development Environments

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, references/devbox.md, T-DEVBOX-001

## Context

The greeting-service must run identically on developer machines, in CI agents, and in pi
skill sessions. Without a pinned toolchain, tool version drift causes "works on my machine"
failures. The repository already contains `devbox.json` and `devbox.lock`.

## Decision

We will use **Devbox** (Nix-backed reproducible dev environments) with the Node.js
template. `devbox.json` and `devbox.lock` are both committed. All local and CI commands run
via `devbox run <script>`.

Key packages pinned:
- `nodejs@22` — runtime and test runner
- `gitleaks@latest` — secrets scanning
- `trivy@latest` — dependency and container CVE scanning

Standard scripts exposed:
- `devbox run test` → `node --test`
- `devbox run lint` → `npx eslint . --max-warnings=0`
- `devbox run lint-fix` → `npx eslint . --fix`
- `devbox run security` → `npm audit --audit-level=high && gitleaks detect --no-git --quiet`
- `devbox run image-build` → `docker build -t $IMAGE_NAME:local .`
- `devbox run image-scan` → `trivy image --severity CRITICAL,HIGH --exit-code 1 $IMAGE_NAME:local`

In GitHub Actions, `jetify-com/devbox-install-action@v0.4.0` with `enable-cache: true`
restores the Nix package cache, reducing CI cold install from ~5 min to ~5 s.

## Alternatives Considered

- **`actions/setup-node`** — sets up Node.js in CI but not local dev; no tool pinning for
  gitleaks/trivy; inconsistency between local and CI environments.
- **Docker-in-Docker dev container** — heavier; slower local startup; overkill for a
  Node.js CLI toolchain.
- **Mise / asdf** — version managers but don't pin non-Node tooling (gitleaks, trivy);
  less integrated with CI cache.

## Consequences

**Positive**
- Exact same tool versions in local dev, CI, and pi agent sessions.
- `devbox.lock` is the reproducibility contract — pinned Nix store hashes.
- `jetify-com/devbox-install-action` handles CI installation transparently.
- New contributors run `devbox shell` and have a working environment immediately.

**Negative / trade-offs**
- Devbox requires Nix as an underlying dependency (installed by devbox installer script).
  First-time install takes ~2 minutes; subsequent restores from Nix cache are fast.
- `gh` (GitHub CLI) and `docker` are system-level prerequisites, not in `devbox.json`.

**Neutral / follow-ups**
- `devbox.lock` must be committed; do not add it to `.gitignore`.
- When adding a new tool, run `devbox add <pkg>` and commit the updated `devbox.lock`.
