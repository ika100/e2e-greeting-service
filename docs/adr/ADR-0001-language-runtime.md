# ADR-0001: Node.js 22 LTS as Language Runtime

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, openspec/project.md

## Context

The greeting-service needs a language runtime. The `devbox.json` already pins `nodejs@22`.
The platform team is familiar with JavaScript/Node.js. The service is I/O-light (no
database, no downstream calls), so runtime performance difference between options is negligible.

## Decision

We will use **Node.js 22 LTS** as the runtime for the greeting-service.

## Alternatives Considered

- **Go 1.22** — excellent performance and small binaries, but switching cost is high when
  Node.js is already pinned and the team is familiar with JS.
- **Python 3.12** — familiar but slower cold start, GIL constraints; no benefit over Node.js
  for this use case.
- **Deno 2** — secure by default but smaller ecosystem and unjustified migration cost.

## Consequences

**Positive**
- Zero additional setup: Node.js 22 is already in `devbox.json` and `devbox.lock`.
- LTS support through April 2027.
- Large npm ecosystem available.
- CodeQL supports JavaScript/Node.js natively.

**Negative / trade-offs**
- JavaScript is dynamically typed; discipline required to avoid runtime type errors
  (mitigated by Fastify's schema validation and JSDoc or TypeScript in future).

**Neutral / follow-ups**
- Evaluate TypeScript adoption in v2 if the codebase grows.
