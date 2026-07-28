# ADR-0004: Multi-Stage Docker Image on node:22-alpine

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, openspec/specs/security/spec.md, TC-SEC-004

## Context

The greeting-service must be containerised for deployment to Kubernetes via ArgoCD. The
security spec requires the image to run as non-root and have zero CRITICAL/HIGH CVEs at
release. Image size affects pull latency and registry storage costs.

## Decision

We will build a **multi-stage Docker image** using `node:22-alpine` as the base image.
The build stage installs npm dependencies; the runtime stage copies only production
artefacts and runs as a non-root user (UID 1001).

## Alternatives Considered

- **`node:22-slim` (Debian slim)** — larger (~180 MB vs ~60 MB for alpine) with more
  potential CVEs in system packages. No benefit for this use case.
- **`node:22` (full Debian)** — ~950 MB; entirely disproportionate; many unnecessary
  system packages increase attack surface.
- **Distroless (`gcr.io/distroless/nodejs22-debian12`)** — smallest attack surface and no
  shell, but harder to debug and more complex Dockerfile. Low priority for v1; revisit in v2.

## Consequences

**Positive**
- Alpine images have significantly fewer OS-level packages → fewer CVE surface area.
- Multi-stage build ensures devDependencies and build tools are not present in the final image.
- Non-root user (UID 1001) satisfies security spec requirement.
- Image size ~60 MB makes pulls fast in CI and in cluster.

**Negative / trade-offs**
- Alpine uses musl libc instead of glibc; some native Node.js addons may need recompilation.
  Not a concern for this service (no native addons).
- Debugging inside a running container is slightly harder without a shell (alpine has `sh`
  so this is manageable).

**Neutral / follow-ups**
- Pin the alpine image digest in CI (e.g., `node:22-alpine@sha256:...`) for reproducibility.
- Trivy image scan runs in CI after build; any new CRITICAL/HIGH CVEs block the release.
- Evaluate Distroless for v2 if security posture needs to be hardened further.
