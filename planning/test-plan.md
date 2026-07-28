# Test Plan — greeting-service

> **Traceability:** Every OpenSpec scenario maps to at least one test case here.
> Every coding task names the tests that prove it.
> See `docs/testing-strategy.md` for tooling, coverage targets, and CI gates.

---

## Coverage Summary

| Level | Framework / Tool | Where it runs | Target |
|-------|-----------------|---------------|--------|
| Unit | `node:test` + `node:assert` | local + CI `test` job | 100% handler functions |
| Integration | `node:test` + `supertest` | local + CI `test` job | ≥ 90% `src/` lines |
| End-to-end | `node:test` + `node:fetch` / `docker compose` | local / optional CI | critical journeys |
| Non-functional | CodeQL, Trivy, Gitleaks, npm audit | CI `security` job | see gates |

---

## Test Cases

### Functional — GET /greet

| Test ID | Level | Verifies (Req / Scenario) | For task | Preconditions | Steps | Expected result |
|---------|-------|--------------------------|----------|---------------|-------|-----------------|
| TC-001 | integration | REQ: Return personalised greeting / Happy-path greeting | T-011, T-020 | Fastify app built | `GET /greet?name=Alice` | `200 OK`; body `{ "greeting": "Hello, Alice!" }`; `Content-Type: application/json` |
| TC-002 | integration | REQ: Return personalised greeting / Name with special characters | T-011, T-020 | Fastify app built | `GET /greet?name=María` | `200 OK`; body contains `"María"` in greeting |
| TC-003 | integration | REQ: Return personalised greeting / Name with leading/trailing whitespace | T-011, T-020 | Fastify app built | `GET /greet?name=%20Alice%20` | `200 OK`; body `{ "greeting": "Hello, Alice!" }` (trimmed) |
| TC-004 | unit | REQ: Return personalised greeting / Handler pure function | T-011 | `greetHandler` imported | Call `greetHandler('Bob')` | Returns string `"Hello, Bob!"` |
| TC-005 | integration | REQ: Reject missing name parameter / Missing name | T-011, T-020 | Fastify app built | `GET /greet` (no query params) | `400 Bad Request`; body `{ "error": "name query parameter is required" }` |
| TC-006 | integration | REQ: Reject missing name parameter / Empty name | T-011, T-020 | Fastify app built | `GET /greet?name=` | `400 Bad Request`; body `{ "error": "name query parameter is required" }` |
| TC-007 | integration | REQ: Enforce maximum name length / Name exceeds max | T-011, T-020 | Fastify app built | `GET /greet?name=<101-char string>` | `400 Bad Request`; body `{ "error": "name must not exceed 100 characters" }` |
| TC-008 | integration | REQ: Enforce maximum name length / Name at max length | T-011, T-020 | Fastify app built | `GET /greet?name=<100-char string>` | `200 OK`; body contains full name |
| TC-009 | integration | REQ (security): Sanitise input / Null-byte injection | T-011, T-020 | Fastify app built | `GET /greet?name=foo%00bar` (null byte) | `400 Bad Request`; body `{ "error": "name contains invalid characters" }` |

### Functional — GET /health

| Test ID | Level | Verifies (Req / Scenario) | For task | Preconditions | Steps | Expected result |
|---------|-------|--------------------------|----------|---------------|-------|-----------------|
| TC-010 | integration | REQ: Expose health probe endpoint / Service is up | T-010, T-DOCKER-001 | Fastify app built | `GET /health` | `200 OK`; body `{ "status": "ok" }`; `Content-Type: application/json` |

### Functional — Error handling

| Test ID | Level | Verifies (Req / Scenario) | For task | Preconditions | Steps | Expected result |
|---------|-------|--------------------------|----------|---------------|-------|-----------------|
| TC-011 | integration | REQ: Return 404 for unknown routes | T-010, T-020 | Fastify app built | `GET /unknown` | `404 Not Found`; body `{ "error": "Not Found" }`; `Content-Type: application/json` |
| TC-012 | integration | REQ (contracts): Consistent error envelope | T-010, T-011, T-020 | Fastify app built | `GET /greet` (no name) | `Content-Type: application/json`; body is valid JSON object with `error` key |

### End-to-End

| Test ID | Level | Verifies (Req / Scenario) | For task | Preconditions | Steps | Expected result |
|---------|-------|--------------------------|----------|---------------|-------|-----------------|
| TC-013 | e2e | REQ: Return personalised greeting / Full stack | T-DOCKER-001, T-DOCKER-002 | `docker compose up --build` running | `curl http://localhost:3000/greet?name=World` | `200 OK`; `{ "greeting": "Hello, World!" }` |
| TC-014 | e2e | REQ: Health probe / Container running | T-DOCKER-001, T-DOCKER-002 | `docker compose up --build` running | `curl http://localhost:3000/health` | `200 OK`; `{ "status": "ok" }` |
| TC-015 | e2e | REQ: Reject missing name / End-to-end error | T-DOCKER-001, T-DOCKER-002 | `docker compose up --build` running | `curl http://localhost:3000/greet` | `400`; JSON body with `error` key |

### Non-Functional — Performance

| Test ID | Level | Verifies (Req / Scenario) | For task | Preconditions | Steps | Expected result |
|---------|-------|--------------------------|----------|---------------|-------|-----------------|
| TC-016 | non-functional | REQ: Respond within latency budget / 100 concurrent clients | T-011, T-010 | Service running locally | Run `autocannon -c 100 -d 10 http://localhost:3000/greet?name=Test` | p95 latency ≤ 50 ms; error rate = 0% |

### Non-Functional — Security

| Test ID | Level | Verifies (Req / Scenario) | For task | Tool | Pass condition |
|---------|-------|--------------------------|----------|------|---------------|
| TC-SEC-001 | non-functional | REQ-security: No CRITICAL/HIGH SAST vulnerabilities | T-CI-001, T-SEC-001 | CodeQL (`security-extended`) | Zero CRITICAL/HIGH alerts in GitHub Security tab; CI job exits 0 |
| TC-SEC-002 | non-functional | REQ-security: No CRITICAL/HIGH dependency CVEs | T-021, T-SEC-001 | Trivy (fs) + npm audit | `trivy fs` exits 0; `npm audit --audit-level=high` exits 0 |
| TC-SEC-003 | non-functional | REQ-security: No secrets in codebase | T-SEC-001 | Gitleaks | `gitleaks detect --no-git --quiet` exits 0; no leaks detected |
| TC-SEC-004 | non-functional | REQ-security: Container CVE-free | T-DOCKER-001, T-REL-002 | Trivy (image) | `trivy image --severity CRITICAL,HIGH --exit-code 1 <image>` exits 0 |
| TC-SEC-005 | non-functional | REQ-security: Run container as non-root | T-DOCKER-001 | Docker inspect / `id` | Process UID inside container is 1001 (non-root) |
| TC-SEC-006 | integration | REQ-security: Sanitise input / Injection attempt | T-011, T-020 | `node:test` + `supertest` | `GET /greet?name=<script>` returns `400` OR greeting does not evaluate script; no XSS possible in JSON response |

---

## Traceability Check

### Requirement → Test Case Mapping

| Requirement | Scenarios covered | Test cases |
|-------------|------------------|-----------|
| Return personalised greeting | Happy-path, special chars, whitespace trim | TC-001, TC-002, TC-003, TC-004 |
| Reject missing name parameter | Missing, empty | TC-005, TC-006 |
| Enforce maximum name length | Exceeds max, at max | TC-007, TC-008 |
| Expose health probe endpoint | Service up | TC-010 |
| Return 404 for unknown routes | Unknown path | TC-011 |
| Consistent error envelope | Error format | TC-012 |
| Sanitise and validate all input | Null byte, injection | TC-009, TC-SEC-006 |
| Run container as non-root | Container UID | TC-SEC-005 |
| Ship CVE-free image | Trivy scan | TC-SEC-004 |
| No secrets in repo | Gitleaks | TC-SEC-003 |
| No CRITICAL/HIGH SAST | CodeQL | TC-SEC-001 |
| No CRITICAL/HIGH dep CVEs | Trivy FS + npm audit | TC-SEC-002 |
| Respond within latency budget | 100 concurrent clients | TC-016 |

### Task → Test Case Mapping

| Task | Tests |
|------|-------|
| T-001 | — |
| T-DEVBOX-001 | — |
| T-CI-001 | TC-SEC-001, TC-SEC-002, TC-SEC-003 |
| T-SEC-001 | TC-SEC-001, TC-SEC-002, TC-SEC-003, TC-SEC-004 |
| T-REL-001 | — |
| T-DOCKER-001 | TC-SEC-004, TC-SEC-005, TC-010, TC-013, TC-014 |
| T-DOCKER-002 | TC-013, TC-014, TC-015 |
| T-010 | TC-005, TC-006, TC-010, TC-011, TC-012 |
| T-011 | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-009, TC-SEC-006 |
| T-020 | TC-001 through TC-012, TC-SEC-006 |
| T-021 | TC-SEC-002 |
| **T-040** | **TC-VER-001, TC-VER-002, TC-VER-003** |
| T-REL-002 | TC-SEC-004 (container scan on release image) |

### Version Endpoint Test Cases (T-040)

| Test ID | Level | Verifies | For task | Preconditions | Steps | Expected result |
|---------|-------|---------|----------|---------------|-------|------------------|
| TC-VER-001 | Integration | `GET /version` returns 200 with correct body | T-040 | Fastify app started via `buildApp()` | `app.inject({ method: 'GET', url: '/version' })` | Status 200; body `{ name: 'greeting-service', version: <matches package.json>, gitUrl: 'https://github.com/ika100/e2e-greeting-service' }` |
| TC-VER-002 | Integration | `version` field matches `package.json` | T-040 | Same as above | Compare `response.body.version` with `JSON.parse(readFileSync('package.json')).version` | Values are equal |
| TC-VER-003 | Integration | `GET /version` is accessible without auth | T-040 | App started, no auth headers | `GET /version` with no headers | Status 200 (not 401/403) |

---

### Coverage checklist

- [x] Every requirement scenario appears in the "Verifies" column at least once.
- [x] Every task in the task plan appears in the "For task" column.
- [x] Error, boundary, and negative cases have dedicated test cases (TC-005–TC-009, TC-011).
- [x] Security test cases TC-SEC-001 through TC-SEC-004 are present (required standard set).
- [x] Container-specific security test TC-SEC-004, TC-SEC-005 included (microservice type).
- [x] Performance test included (TC-016).
- [x] About feature version endpoint test cases TC-VER-001–TC-VER-003 added (T-040).
