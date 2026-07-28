# Coding Task Plan — greeting-service

> **Project type:** microservice  
> **Traceability:** Tasks link to requirements (REQ) and ADRs. Tests that verify each task
> are listed in `planning/test-plan.md`.  
> **Parallelism:** Tasks within a Wave are **[parallel]** — the build skill runs them in
> isolated git worktrees. Foundational tasks run serially first.

---

## Milestones

| ID | Name | Definition |
|----|------|-----------|
| **M1** | Foundation | CI green, security scanning configured, devbox working, scaffold in place |
| **M2** | Walking skeleton | `GET /greet?name=X` returns `200 OK` with greeting; health endpoint up |
| **M3** | Hardened & containerised | Input validation, error handling, Docker image builds and passes Trivy |
| **M4** | Release ready | All tests pass, security clean, CHANGELOG/release automation wired up |

---

## Foundational Tasks (serial — run in this order)

### T-001 — Project scaffolding & structure

| Field | Value |
|-------|-------|
| **Implements** | — |
| **Depends on** | — |
| **Milestone** | M1 |
| **Estimate** | S (< 2 h) |

**Description:**  
Initialise the Node.js project structure, configuration files, and `.gitignore`.

**Acceptance criteria:**
- `package.json` exists with `"name": "greeting-service"`, `"version": "0.1.0"`, `"type": "module"` (ESM)
- `src/` directory exists with placeholder files (`app.js`, `server.js`, `routes/`)
- `test/` directory exists
- `.gitignore` includes: `node_modules/`, `.worktrees/`, `planning/.build/`, `coverage/`, `.env`
- ESLint configured (`eslint.config.js`) with `@eslint/js` recommended rules
- `devbox run lint` exits 0 on empty scaffold

**Tests:** none (scaffold only)

---

### T-DEVBOX-001 — Devbox environment setup

| Field | Value |
|-------|-------|
| **Implements** | ADR-0009 |
| **Depends on** | T-001 |
| **Milestone** | M1 |
| **Estimate** | S (< 1 h) |

**Description:**  
Verify and finalise the existing `devbox.json`. Confirm all standard scripts work.
The `devbox.json` and `devbox.lock` are already present in the repo (pre-seeded by platform
scaffolding). This task validates and adjusts them as needed after T-001 scaffolding is complete.

**Acceptance criteria:**
- `devbox.json` has all standard scripts: `test`, `lint`, `lint-fix`, `build`, `security`,
  `image-build`, `image-scan`
- `devbox.lock` is committed (already present; do not modify unless packages change)
- `devbox run lint` exits 0
- `devbox run test` exits 0 (empty test suite is acceptable at this stage)
- `devbox run security` exits 0 on the clean scaffold (no CVEs, no secrets)
- `IMAGE_NAME=ghcr.io/ika100/e2e-greeting-service` set in `devbox.json` env

**Tests:** none (environment setup only)

---

### T-CI-001 — GitHub Actions CI pipeline

| Field | Value |
|-------|-------|
| **Implements** | ADR-0005 |
| **Depends on** | T-DEVBOX-001 |
| **Milestone** | M1 |
| **Estimate** | M (2–4 h) |

**Description:**  
Create `.github/workflows/ci.yml` adapted from the microservice template. All jobs use
`jetify-com/devbox-install-action` and `devbox run <script>`.

**Adapted pipeline template** (from `assets/github-actions-microservice.yml`):

```yaml
name: CI

on:
  push:
    branches: [main]
    tags: ["v*"]
  pull_request:
    branches: [main]

env:
  REGISTRY:   ghcr.io
  IMAGE_NAME: ghcr.io/ika100/e2e-greeting-service

permissions:
  contents:        read
  packages:        write
  security-events: write
  pull-requests:   read

jobs:
  security:
    name: Security
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: jetify-com/devbox-install-action@v0.4.0
        with:
          enable-cache: true
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript
          queries: security-extended
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
        with:
          upload: true
      - name: Local security scan
        run: devbox run security
      - name: Dependency vulnerability scan (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          format: sarif
          output: trivy-fs-results.sarif
          severity: CRITICAL,HIGH
          exit-code: "1"
      - name: Upload Trivy results
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-fs-results.sarif
          category: trivy-dependencies

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jetify-com/devbox-install-action@v0.4.0
        with:
          enable-cache: true
      - name: Lint
        run: devbox run lint
      - name: Test
        run: devbox run test
        env:
          NODE_ENV: test
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [security, test]
    outputs:
      sha-tag: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
    steps:
      - uses: actions/checkout@v4
      - uses: jetify-com/devbox-install-action@v0.4.0
        with:
          enable-cache: true
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        if: github.event_name != 'pull_request'
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=ref,event=branch
            type=ref,event=pr
      - name: Build (and push if not PR)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Container vulnerability scan (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
          format: sarif
          output: trivy-image-results.sarif
          severity: CRITICAL,HIGH
          exit-code: "1"
      - name: Upload container scan results
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-image-results.sarif
          category: trivy-container

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: [security, test, build]
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: jetify-com/devbox-install-action@v0.4.0
        with:
          enable-cache: true
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract semver from tag
        id: version
        run: echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      - name: Build and push release image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body_path: .release-notes.md
          prerelease: ${{ contains(github.ref, '-alpha') || contains(github.ref, '-beta') || contains(github.ref, '-rc') }}
          token: ${{ secrets.GITHUB_TOKEN }}

  gitops-update:
    name: GitOps Update
    runs-on: ubuntu-latest
    needs: [release]
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Check secrets configured
        id: check
        run: |
          if [ -z "${{ secrets.GITOPS_PAT }}" ] || [ -z "${{ secrets.GITOPS_REPO }}" ]; then
            echo "skip=true" >> $GITHUB_OUTPUT
          else
            echo "skip=false" >> $GITHUB_OUTPUT
          fi
      - uses: actions/checkout@v4
        if: steps.check.outputs.skip == 'false'
        with:
          repository: ${{ secrets.GITOPS_REPO }}
          token: ${{ secrets.GITOPS_PAT }}
          path: gitops
      - uses: jetify-com/devbox-install-action@v0.4.0
        if: steps.check.outputs.skip == 'false'
        with:
          enable-cache: true
          project-path: gitops
      - name: Update image tag
        if: steps.check.outputs.skip == 'false'
        run: |
          VERSION="${GITHUB_REF#refs/tags/v}"
          VALUES="gitops/${{ vars.GITOPS_VALUES_PATH }}"
          yq e -i ".image.tag = \"${VERSION}\"" "$VALUES"
      - uses: peter-evans/create-pull-request@v6
        if: steps.check.outputs.skip == 'false'
        with:
          token: ${{ secrets.GITOPS_PAT }}
          path: gitops
          commit-message: "chore(deps): bump greeting-service to ${{ github.ref_name }}"
          branch: "bump/greeting-service-${{ github.ref_name }}"
          title: "⬆️ Bump greeting-service to ${{ github.ref_name }}"
          delete-branch: true
```

**Acceptance criteria:**
- `.github/workflows/ci.yml` exists and is valid YAML
- `security` and `test` jobs run on every PR
- `build` job runs after `security` + `test` pass
- `release` job triggers on `v*` tags only
- `gitops-update` job opens a PR in `ika100/e2e-gitops` after release
- All jobs use `jetify-com/devbox-install-action` + `devbox run <script>`

**Tests:** TC-SEC-001, TC-SEC-002, TC-SEC-003

---

### T-SEC-001 — Security scanning integration

| Field | Value |
|-------|-------|
| **Implements** | ADR-0007, security spec |
| **Depends on** | T-CI-001 |
| **Milestone** | M1 |
| **Estimate** | M (2–4 h) |

**Description:**  
Validate and verify all three security scanning layers are functional:
1. CodeQL SAST (`javascript`, `security-extended` queries) → SARIF upload.
2. Trivy filesystem scan on every PR → SARIF upload.
3. Gitleaks (`gitleaks detect --no-git --quiet`) via `devbox run security`.
4. `npm audit --audit-level=high` via `devbox run security`.
5. Trivy container scan after Docker build.

Also configure GitHub branch protection to require the `CI / Security` status check.

**Acceptance criteria:**
- `CI / Security` job appears in GitHub Actions and passes on a clean PR
- SARIF results visible in GitHub Security tab (Code Scanning)
- A deliberate test secret (e.g., `AWS_SECRET_KEY=test123` in a temp file, never committed)
  causes `devbox run security` to exit non-zero locally
- `devbox run security` exits 0 on clean codebase
- Branch protection configured: `CI / Security` and `CI / Test` are required status checks

**Tests:** TC-SEC-001, TC-SEC-002, TC-SEC-003, TC-SEC-004

---

### T-REL-001 — Semver & CHANGELOG automation

| Field | Value |
|-------|-------|
| **Implements** | ADR-0008 |
| **Depends on** | T-001 |
| **Milestone** | M1 |
| **Estimate** | S (< 2 h) |

**Description:**  
Prepare the repository for automated releases:
- Ensure `openspec/project.md` frontmatter has `version: 0.1.0`.
- Ensure `package.json` has `"version": "0.1.0"`.
- Create `CHANGELOG.md` with the initial `[Unreleased]` section (Keep a Changelog format).
- Document the conventional commit convention in `CONTRIBUTING.md` (brief, one page).

**Acceptance criteria:**
- `openspec/project.md` frontmatter contains `version: 0.1.0`
- `package.json` contains `"version": "0.1.0"`
- `CHANGELOG.md` exists with `## [Unreleased]` section
- `CONTRIBUTING.md` documents commit type → semver bump mapping
- Release skill can determine next version (`0.1.0`) from `feat:` commits on a clean `main`

**Tests:** none (release automation tooling only)

---

### T-DOCKER-001 — Multi-stage Dockerfile

| Field | Value |
|-------|-------|
| **Implements** | ADR-0004, openspec/specs/security/spec.md (non-root, CVE-free) |
| **Depends on** | T-001 |
| **Milestone** | M1 |
| **Estimate** | S (< 2 h) |

**Description:**  
Write a production-optimised multi-stage `Dockerfile`:

```dockerfile
# Stage 1: deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json .
USER appuser
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**Acceptance criteria:**
- `docker build -t greeting-service:local .` succeeds (requires working `src/server.js`)
- `docker run --rm greeting-service:local id` outputs a non-root UID (1001)
- `devbox run image-scan` (Trivy) exits 0 — no CRITICAL/HIGH CVEs in the built image
- Image size ≤ 200 MB
- Container responds to `GET /health` on port 3000

**Tests:** TC-SEC-004, TC-010

---

### T-DOCKER-002 — Docker Compose for local dev/test

| Field | Value |
|-------|-------|
| **Implements** | — |
| **Depends on** | T-DOCKER-001 |
| **Milestone** | M1 |
| **Estimate** | S (< 1 h) |

**Description:**  
Create `docker-compose.yml` for local integration testing and development convenience.

```yaml
services:
  greeting-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      LOG_LEVEL: debug
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

**Acceptance criteria:**
- `docker compose up --build` starts the service
- `curl http://localhost:3000/greet?name=World` returns `{ "greeting": "Hello, World!" }`
- `curl http://localhost:3000/health` returns `{ "status": "ok" }`
- `docker compose down` stops and removes containers cleanly

**Tests:** TC-003 (e2e via compose)

---

## Feature Tasks

### Wave 1 — Core Business Logic **[parallel]** _(branch from main after M1 complete)_

---

#### T-010 — Fastify app factory & server entry point

| Field | Value |
|-------|-------|
| **Implements** | REQ: Expose health probe endpoint |
| **Depends on** | T-001, T-DEVBOX-001 |
| **Milestone** | M2 |
| **Estimate** | S (< 2 h) |

**Description:**  
Create the Fastify application factory in `src/app.js` (exported for testing) and the
server entry point in `src/server.js`. Register only the health route at this stage.

Key implementation notes:
- `src/app.js` exports `buildApp(opts)` → returns a configured Fastify instance
- `src/server.js` calls `buildApp()`, binds to `PORT` env var (default 3000), logs start
- Fastify options: `{ logger: { level: process.env.LOG_LEVEL || 'info' } }`
- Register a 404 handler that returns `{ "error": "Not Found" }`
- Override the default error serialiser to always return `{ "error": "<message>" }`
- Health route: `GET /health` → `{ "status": "ok" }`

**Acceptance criteria:**
- `node src/server.js` starts without error and binds to port 3000
- `GET /health` returns `200 { "status": "ok" }`
- `GET /unknown` returns `404 { "error": "Not Found" }`
- `devbox run test` passes
- `devbox run lint` exits 0

**Tests:** TC-005, TC-006

---

#### T-011 — GET /greet route handler

| Field | Value |
|-------|-------|
| **Implements** | REQ: Return personalised greeting, REQ: Reject missing name, REQ: Enforce maximum name length |
| **Depends on** | T-001, T-DEVBOX-001 |
| **Milestone** | M2 |
| **Estimate** | M (2–4 h) |

**Description:**  
Implement the `GET /greet` route in `src/routes/greet.js` using Fastify's built-in AJV
schema validation.

Route schema:
```javascript
const schema = {
  querystring: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        // printable characters only: no control chars, no null bytes
        pattern: '^[\\x20-\\x7E\\u00A0-\\uFFFF]+$'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: { greeting: { type: 'string' } }
    }
  }
}
```

Handler logic:
- Trim `request.query.name`
- Return `{ greeting: \`Hello, ${trimmedName}!\` }`
- AJV validation handles missing/empty/too-long/invalid-char cases automatically
- Override Fastify's 400 error messages to match the contract spec exactly

**Custom error messages** (set in `setErrorHandler`):
- Missing `name` → `{ "error": "name query parameter is required" }`
- Too long → `{ "error": "name must not exceed 100 characters" }`
- Invalid characters → `{ "error": "name contains invalid characters" }`

**Acceptance criteria:**
- `GET /greet?name=Alice` → `200 { "greeting": "Hello, Alice!" }`
- `GET /greet?name=%20Alice%20` → `200 { "greeting": "Hello, Alice!" }` (trimmed)
- `GET /greet` (no name) → `400 { "error": "name query parameter is required" }`
- `GET /greet?name=` → `400 { "error": "name query parameter is required" }`
- `GET /greet?name=<101-char string>` → `400 { "error": "name must not exceed 100 characters" }`
- `GET /greet?name=<string with null byte>` → `400 { "error": "name contains invalid characters" }`
- All unit tests pass; `devbox run test` exits 0

**Tests:** TC-001, TC-002, TC-003, TC-004, TC-007, TC-008, TC-009

---

### Wave 2 — Integration & hardening **[parallel]** _(branch from main after Wave 1 merged)_

---

#### T-020 — Integration test suite

| Field | Value |
|-------|-------|
| **Implements** | All greeting spec requirements |
| **Depends on** | T-010, T-011 |
| **Milestone** | M3 |
| **Estimate** | M (2–4 h) |

**Description:**  
Write comprehensive integration tests using `supertest` against the Fastify app (no live
port needed). Tests cover all scenarios from `openspec/specs/greeting/spec.md` and
`openspec/specs/security/spec.md`.

Test files:
- `test/greet.test.js` — all `/greet` scenarios
- `test/health.test.js` — `/health` scenario
- `test/errors.test.js` — 404 and global error format

**Acceptance criteria:**
- `devbox run test` runs all test files and exits 0
- All 12+ test cases pass (see `planning/test-plan.md`)
- Coverage report generated (optional: `--experimental-test-coverage`)
- No test depends on network or external state (pure in-process)

**Tests:** TC-001 through TC-012

---

#### T-021 — Dependency audit & remediation baseline

| Field | Value |
|-------|-------|
| **Implements** | REQ-security: No CRITICAL/HIGH dependency CVEs, ADR-0007 |
| **Depends on** | T-010, T-011 |
| **Milestone** | M3 |
| **Estimate** | S (< 2 h) |

**Description:**  
Run a full dependency audit on the finalised `package.json` and remediate any findings:

1. `npm audit --audit-level=high` — triage and fix HIGH/CRITICAL CVEs.
2. `devbox run security` — confirm clean exit.
3. Update `package.json` if any deps need version bumps.
4. Document any accepted/deferred LOW/MEDIUM findings in `docs/security-exceptions.md`
   (if any).

**Acceptance criteria:**
- `npm audit --audit-level=high` exits 0
- `devbox run security` exits 0
- No HIGH or CRITICAL CVEs in dependency tree
- `package-lock.json` committed with updated versions (if any changes)

**Tests:** TC-SEC-002

---

---

## About Feature Tasks — Wave 3 [parallel] _(branch from main after Wave 2 merged)_

---

### T-040 — GET /version endpoint

| Field | Value |
|-------|-------|
| **Implements** | openspec/specs/about/spec.md VER-001 |
| **Depends on** | T-010, T-011 (app factory in place) |
| **Milestone** | M3 |
| **Estimate** | S (< 2 h) |

**Description:**  
Add a `GET /version` route to the greeting-service so the frontend About page can fetch
live version info.

Implementation steps:
1. Create `src/routes/version.js` as a Fastify plugin.
2. Read `version` from `package.json` at **module load time** (not per-request) using
   `import { createRequire } from 'module'` or a top-level `fs.readFileSync` on startup.
3. Hardcode `gitUrl` as `https://github.com/ika100/e2e-greeting-service`.
4. Register the route in `src/app.js`.
5. Add an integration test in `test/version.test.js`.

**Route definition:**
```javascript
// src/routes/version.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

export default async function versionRoutes(app) {
  app.get('/version', {
    schema: {
      response: {
        200: {
          type: 'object',
          required: ['name', 'version', 'gitUrl'],
          properties: {
            name:    { type: 'string' },
            version: { type: 'string' },
            gitUrl:  { type: 'string' },
          },
        },
      },
    },
  }, async (_req, _reply) => ({
    name: 'greeting-service',
    version: pkg.version,
    gitUrl: 'https://github.com/ika100/e2e-greeting-service',
  }));
}
```

**Register in `src/app.js`:**
```javascript
app.register(import('./routes/version.js'));
```

**Acceptance criteria:**
- `GET /version` returns `200 OK` with `Content-Type: application/json`
- Response body has `name: "greeting-service"`, `version` matching `package.json`, and
  `gitUrl: "https://github.com/ika100/e2e-greeting-service"`
- `version` is not hardcoded — changing `package.json` version reflects in the response
- Endpoint is accessible without authentication
- `devbox run test` passes with new test file `test/version.test.js`
- `devbox run lint` exits 0

**Tests:** TC-VER-001, TC-VER-002, TC-VER-003

---

## Release Tasks (serial — after all waves merged)

### T-REL-002 — First versioned release (v0.1.0)

| Field | Value |
|-------|-------|
| **Implements** | ADR-0008 |
| **Depends on** | All feature tasks merged to `main`, CI green |
| **Milestone** | M4 |
| **Estimate** | S (automated by release skill) |

**Description:**  
Cut the first versioned release using the release skill:
1. Determine version `0.1.0` from `feat:` commits.
2. Update `CHANGELOG.md` with `## [0.1.0]` section.
3. Bump version in `openspec/project.md` and `package.json`.
4. Generate `.release-notes.md`.
5. Create git tag `v0.1.0` on `main`.
6. CI `release` job: build + push Docker image `ghcr.io/ika100/e2e-greeting-service:0.1.0` and `:latest`.
7. Create GitHub Release.
8. CI `gitops-update` job: open PR in `ika100/e2e-gitops` updating `apps/greeting-service/values.yaml`.

**Acceptance criteria:**
- `v0.1.0` tag exists on `main`
- `ghcr.io/ika100/e2e-greeting-service:0.1.0` and `:latest` exist in ghcr.io
- GitHub Release `v0.1.0` created with release notes
- PR opened in `ika100/e2e-gitops` updating image tag to `0.1.0`
- `CHANGELOG.md` has `## [0.1.0]` entry

**Tests:** all CI tests green on tag; TC-SEC-004 (container scan passes)

---

## Sequencing Summary

```
M1 (serial foundation):
  T-001 → T-DEVBOX-001 → T-CI-001 → T-SEC-001
  T-001 → T-REL-001            (parallel with T-DEVBOX-001)
  T-001 → T-DOCKER-001 → T-DOCKER-002   (parallel with T-DEVBOX-001)

M2/M3 (parallel waves, after M1 complete):
  Wave 1 [parallel]: T-010 || T-011
  Wave 2 [parallel]: T-020 || T-021   (after Wave 1 merged)

M4 (serial release, after all waves):
  T-REL-002
```

**Critical path:** T-001 → T-DEVBOX-001 → T-CI-001 → T-SEC-001 → T-010 + T-011 → T-020 → T-REL-002

---

## Estimate Legend

| Size | Hours |
|------|-------|
| S | < 2 h |
| M | 2–4 h |
| L | 4–8 h |

---

## Definition of Done (all tasks)

- Code implemented per acceptance criteria
- Tests written and passing (`devbox run test` exits 0)
- `devbox run lint` exits 0
- `devbox run security` exits 0
- PR opened with Conventional Commit title `[T-NNN] feat/fix/chore: <summary>`
- CI green (security + test jobs pass)
- Squash-merged to `main`
- Worktree cleaned up (`.worktrees/T-NNN/` removed)
