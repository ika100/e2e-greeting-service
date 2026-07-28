# ADR-0003: Node.js Built-in Test Runner + supertest

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, planning/test-plan.md

## Context

The greeting-service needs a testing approach. The existing `devbox.json` already defines
`"test": "node --test"`, indicating the built-in test runner is intended. The service is
small with one functional endpoint, so a heavyweight test framework would be over-engineering.

## Decision

We will use the **Node.js built-in `node:test` runner** for all unit and integration tests,
with **`supertest`** as the HTTP assertion library to test Fastify routes without a live
server port.

## Alternatives Considered

- **Jest** — feature-rich, excellent DX, but adds a significant dependency and slower startup.
  Overkill for a single-endpoint service.
- **Vitest** — fast and Jest-compatible, but still an additional dependency with no clear
  benefit over the built-in runner at this scale.
- **Mocha + Chai** — classic combo, but requires three additional packages (mocha, chai, c8
  for coverage) vs. zero for the built-in runner.

## Consequences

**Positive**
- Zero additional test framework dependencies; reduces supply-chain attack surface.
- `node --test` is stable since Node.js 20; built-in coverage with `--experimental-test-coverage`.
- `supertest` enables HTTP-level integration tests without binding a real port.
- Consistent with the `devbox.json` default.

**Negative / trade-offs**
- Built-in runner has fewer features than Jest (e.g., no snapshot testing, no mock timer
  API until Node 22). Acceptable for this service's scope.
- Coverage output requires `--experimental-test-coverage` flag; tooling integration is less
  polished than Jest/c8.

**Neutral / follow-ups**
- Add `supertest` as a `devDependency` in `package.json`.
- If the test suite grows significantly, evaluate Vitest migration.
