# Testing Strategy — greeting-service

> **Related:** [planning/test-plan.md](../planning/test-plan.md) |
> [openspec/specs/greeting/spec.md](../openspec/specs/greeting/spec.md) |
> [openspec/specs/security/spec.md](../openspec/specs/security/spec.md)

---

## Testing Philosophy

The greeting-service is a small, stateless microservice. The test strategy follows the
classic **test pyramid**: many fast unit/integration tests, fewer (but still automated)
end-to-end checks, and non-functional security gates that run in CI.

```
         ┌────────────────────┐
         │   E2E / Contract   │  ← 2–3 tests; docker-compose; TC-003
         ├────────────────────┤
         │    Integration     │  ← ~8 tests; supertest + Fastify; TC-001..TC-009
         ├────────────────────┤
         │   Unit (handlers)  │  ← 3–5 tests; pure function; TC-00x
         └────────────────────┘
         │  Non-functional     │  ← Security scans (TC-SEC-*)
         └────────────────────┘
```

---

## Test Levels

### Unit Tests

**What:** Pure business logic functions independent of HTTP.  
**Scope:** `greetHandler(name)` function — returns correct string, trims whitespace.  
**Tool:** Node.js built-in `node:test` + `node:assert`.  
**Location:** `test/unit/greet.unit.test.js`.  
**Runs:** Locally (`devbox run test`) and in CI `test` job.  
**Target coverage:** 100% of the handler function (it's tiny).

### Integration Tests

**What:** HTTP layer tests against the Fastify application (in-process, no live port).  
**Scope:** All routes (`/greet`, `/health`, unknown routes); all validation scenarios.  
**Tool:** `node:test` + `supertest` (inject requests into Fastify without binding a port).  
**Location:** `test/greet.test.js`, `test/health.test.js`, `test/errors.test.js`.  
**Runs:** Locally (`devbox run test`) and in CI `test` job.  
**Target coverage:** ≥ 90% line coverage across `src/`.

### End-to-End Tests

**What:** Full container stack test (Docker Compose up → real HTTP call → response check).  
**Scope:** Happy-path smoke test; health probe; one error case.  
**Tool:** `curl` or `fetch` against `http://localhost:3000` (via `docker compose up --build`).  
**Location:** `test/e2e/smoke.test.js` (or `test/e2e/smoke.sh`).  
**Runs:** Locally (`docker compose up --build`); optionally in CI as a separate job.  
**Gate:** Pass before release tagging.

### Non-Functional / Security Tests

**What:** Automated security scanning; no manual test steps.  
**Scope:** SAST, dependency CVEs, secrets, container image.  
**Tools:** CodeQL, Trivy, Gitleaks, npm audit.  
**Runs:** CI `security` job on every PR and push to `main`.  
**Gate:** CRITICAL/HIGH findings block PR merge. Container scan blocks release.

---

## Tooling Summary

| Level | Tool | Command | CI Job |
|-------|------|---------|--------|
| Unit + Integration | `node:test` + `supertest` | `devbox run test` | `test` |
| Lint | ESLint (`@eslint/js`) | `devbox run lint` | `test` |
| SAST | CodeQL (JavaScript) | GitHub Action | `security` |
| Dependency CVE (fs) | Trivy | `aquasecurity/trivy-action` (fs) | `security` |
| Dependency CVE (npm) | npm audit | `devbox run security` | `security` |
| Secrets | Gitleaks | `devbox run security` | `security` |
| Container CVE | Trivy | `aquasecurity/trivy-action` (image) | `build` |
| E2E smoke | curl / node:fetch | `docker compose up` | manual / optional CI |

---

## Coverage Targets

| Module | Target |
|--------|--------|
| `src/routes/greet.js` | 100% lines |
| `src/routes/health.js` | 100% lines |
| `src/app.js` (error handler, 404) | ≥ 90% lines |
| Overall `src/` | ≥ 90% lines |

Coverage is generated via `node --test --experimental-test-coverage` and uploaded as an
artifact in CI.

---

## Test Data

All test inputs are inline in test files. No external fixtures needed (stateless service).

**Key test vectors:**

| Input | Expected outcome |
|-------|-----------------|
| `name=Alice` | 200, `"Hello, Alice!"` |
| `name=%20Alice%20` | 200, `"Hello, Alice!"` (trimmed) |
| `name=María` | 200, contains `"María"` |
| `name=` (empty) | 400, required error |
| (no name param) | 400, required error |
| `name=` + 101 chars | 400, too-long error |
| `name=` + 100 chars | 200 |
| `name=<null byte>` | 400, invalid chars |
| `GET /health` | 200, `"ok"` |
| `GET /unknown` | 404, Not Found |

---

## CI Gates

| Gate | Status check name | Blocks |
|------|------------------|--------|
| Lint + unit/integration tests | `CI / Test` | PR merge |
| CodeQL SAST | `CI / Security` | PR merge |
| Trivy FS + npm audit + Gitleaks | `CI / Security` | PR merge |
| Trivy container scan | `CI / Build` | Release (tag) |

---

## Definition of Done (testing)

A task is "done" from a testing perspective when:
1. All new code has associated tests.
2. `devbox run test` exits 0 with no failing tests.
3. `devbox run lint` exits 0.
4. `devbox run security` exits 0.
5. CI `security` and `test` jobs are green on the PR.
6. Coverage does not decrease below the target for the affected module.
