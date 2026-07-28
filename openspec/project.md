---
project-type: microservice
github-repo: ika100/e2e-greeting-service
docker-registry: ghcr.io/ika100
docker-image: ghcr.io/ika100/e2e-greeting-service
gitops-repo: https://github.com/ika100/e2e-gitops.git
gitops-values-path: apps/greeting-service/values.yaml
base-branch: main
version: 0.0.1
---

# greeting-service

REST microservice — `GET /greet?name=X` returns a personalised greeting.

## Purpose

The greeting-service is a lightweight, stateless HTTP microservice that generates
personalised greeting messages on demand. It is a foundational building block of the
`e2e-platform`, consumed primarily by the `frontend` service.

## Users & Context

- **Direct consumers:** `frontend` service (ika100/e2e-frontend) calls `GET /greet?name=X`
  to display a welcome message to the end user.
- **Platform context:** Part of the `e2e-platform` multi-service deployment, managed via
  ArgoCD GitOps from `ika100/e2e-gitops`.
- **Environment:** Runs as a container in Kubernetes, exposed internally within the cluster.

## Scope & Non-Goals

**In scope:**
- Single endpoint: `GET /greet?name=X` → `{ "greeting": "Hello, X!" }`
- Input validation (name parameter)
- Health/readiness probe endpoint
- Containerised deployment via Docker

**Out of scope:**
- Persistence / database (stateless service)
- Authentication / authorisation (internal cluster traffic only)
- Internationalisation / multilingual greetings (v1)
- Rate limiting at the service level (handled at ingress/gateway)

## Success Metrics

- `GET /greet?name=Alice` returns `200 OK` with a greeting containing "Alice".
- p95 latency < 50 ms under normal load.
- Zero CRITICAL/HIGH CVEs in container image at release.
- CI pipeline green on every PR and push to `main`.

## Tech Stack Summary

- **Runtime:** Node.js 22 LTS
- **Framework:** Fastify 4.x
- **Test runner:** Node.js built-in (`node --test`)
- **Container:** Multi-stage Docker image (node:22-alpine)
- **CI/CD:** GitHub Actions + devbox
- **Registry:** `ghcr.io/ika100/e2e-greeting-service`

## Conventions

- All source code in `src/`; tests co-located as `*.test.js` or under `test/`
- ESLint for linting; flat config (`eslint.config.js`)
- Conventional Commits on squash-merge to `main`
- `devbox run <script>` for all local and CI commands

## Links

- Platform config: [../../platform.yaml](../../platform.yaml)
- GitHub repo: <https://github.com/ika100/e2e-greeting-service>
- GitOps repo: <https://github.com/ika100/e2e-gitops>
- Architecture: [../docs/architecture.md](../docs/architecture.md)
- Tech-stack RFC: [../docs/rfcs/RFC-0001-tech-stack.md](../docs/rfcs/RFC-0001-tech-stack.md)
- Task plan: [../planning/task-plan.md](../planning/task-plan.md)
