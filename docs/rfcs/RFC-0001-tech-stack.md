# RFC-0001: Tech Stack Selection — greeting-service

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** openspec/project.md, ADR-0001 through ADR-0008

---

## Problem Statement

Select the language runtime, HTTP framework, testing approach, and container strategy for
the greeting-service microservice. Choices must satisfy:

1. Single stateless GET endpoint with sub-50 ms p95 latency.
2. Minimal attack surface (security requirements in `openspec/specs/security/spec.md`).
3. Consistent with the existing `devbox.json` that already pins Node.js 22.
4. Easy for the e2e-platform team to maintain and extend.

---

## Layer 1: Language & Runtime

### Options

| Option | Fit | Familiarity | Ecosystem | Performance | Security | Verdict |
|--------|-----|------------|-----------|-------------|----------|---------|
| **Node.js 22 LTS** | ✅ Already pinned in devbox.json | ✅ Widely known | ✅ npm ecosystem, large | ✅ Excellent for I/O | ✅ Regular CVE patches | ✅ **Chosen** |
| Go 1.22 | ✅ Excellent fit | ⚠️ Requires Go expertise | ✅ Good | ✅ Excellent | ✅ Strong | ❌ Switching cost high; Node already pinned |
| Python 3.12 | ⚠️ Slower cold start | ✅ Familiar | ✅ Good | ⚠️ GIL; slower | ✅ Good | ❌ No benefit over Node.js for this use case |
| Deno 2 | ✅ Secure by default | ⚠️ Less familiar | ⚠️ Smaller | ✅ Good | ✅ Strong | ❌ Immature ecosystem; unjustified switch |

**Decision: Node.js 22 LTS.** Already committed in `devbox.json`; LTS until April 2027;
excellent performance for HTTP microservices; large ecosystem; team familiarity.

---

## Layer 2: HTTP Framework

### Options

| Option | Performance | Dev Experience | Schema Validation | TypeScript | Maturity | Verdict |
|--------|------------|---------------|-------------------|-----------|---------|---------|
| **Fastify 4.x** | ✅ ~40k req/s | ✅ Plugin system, clear API | ✅ Built-in AJV | ✅ First-class | ✅ Stable | ✅ **Chosen** |
| Express 4.x | ⚠️ ~15k req/s | ✅ Most familiar | ❌ Manual | ✅ Via @types | ✅ Very stable | ❌ Slower; no built-in validation |
| Hapi 21.x | ⚠️ Moderate | ⚠️ More complex | ✅ Joi | ✅ Via @types | ✅ Stable | ❌ More ceremony for a single endpoint |
| Bare `http` module | ✅ Fastest possible | ❌ Low-level | ❌ Manual | ✅ | ✅ | ❌ Too much boilerplate for no real gain |

**Decision: Fastify 4.x.** 2–3× faster than Express; built-in AJV schema validation
eliminates a dependency; excellent pino logging integration; TypeScript-ready; widely
adopted in the Node.js microservice space.

---

## Layer 3: Testing

### Options

| Option | Built-in | Coverage | Speed | Verdict |
|--------|---------|---------|-------|---------|
| **Node.js built-in `node:test`** | ✅ Zero deps | Via `--experimental-test-coverage` | ✅ Fast | ✅ **Chosen** |
| Jest | ❌ Extra dep | ✅ Excellent | ⚠️ Slower startup | ❌ Adds dependency; not needed for this scale |
| Vitest | ❌ Extra dep | ✅ Excellent | ✅ Fast | ❌ Adds dependency |
| Mocha + Chai | ❌ Extra deps | External (c8) | ✅ Fast | ❌ More setup for same result |

**Decision: Node.js built-in test runner.** Already the default in `devbox.json`
(`"test": "node --test"`). Zero additional dependencies; sufficient for this scale.
Use `supertest` for HTTP integration testing of the Fastify server.

---

## Layer 4: Container Strategy

### Options

| Option | Image Size | Security | Build Speed | Verdict |
|--------|-----------|---------|------------|---------|
| **`node:22-alpine` multi-stage** | ✅ ~60 MB | ✅ Minimal attack surface | ✅ Layer cache | ✅ **Chosen** |
| `node:22-slim` | ⚠️ ~180 MB | ⚠️ Larger | ✅ | ❌ Larger than needed |
| `node:22` (full Debian) | ❌ ~950 MB | ❌ Many unnecessary packages | ⚠️ Slow | ❌ Too large |
| Distroless | ✅ ~50 MB | ✅ Excellent | ⚠️ Complex | ⚠️ Debugging harder; low priority for v1 |

**Decision: `node:22-alpine` multi-stage Dockerfile.** Minimal image size; alpine has
fewer CVEs than Debian variants; multi-stage separates build-time deps from runtime.

---

## Layer 5: CI/CD

**Decision: GitHub Actions** with the standard `assets/github-actions-microservice.yml`
template. Pipeline: security scan → test → build Docker → push to
`ghcr.io/ika100/e2e-greeting-service` → GitOps update.

---

## Layer 6: Package Management

**Decision: npm** (bundled with Node.js). `npm ci` in CI for reproducible installs.
`package-lock.json` committed.

---

## Summary of Accepted Decisions

| Layer | Choice | ADR |
|-------|--------|-----|
| Runtime | Node.js 22 LTS | ADR-0001 |
| HTTP Framework | Fastify 4.x | ADR-0002 |
| Testing | Node.js built-in test runner + supertest | ADR-0003 |
| Containerisation | Docker multi-stage, node:22-alpine | ADR-0004 |
| CI/CD platform | GitHub Actions | ADR-0005 |
| Branch strategy | Squash-merge, task/T-NNN branches | ADR-0006 |
| Security scanning | CodeQL + Trivy + Gitleaks | ADR-0007 |
| Release strategy | Semver + conventional commits | ADR-0008 |
| Dev environment | Devbox (Node.js template) | ADR-0009 |
