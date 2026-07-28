# ADR-0002: Fastify 4.x as HTTP Framework

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, REQ: Return personalised greeting

## Context

The greeting-service needs an HTTP framework to handle routing, request parsing, JSON
serialisation, and input validation. The service has a single endpoint with strict input
validation requirements (see `openspec/specs/security/spec.md`). Performance and
security posture are key selection criteria.

## Decision

We will use **Fastify 4.x** as the HTTP framework.

## Alternatives Considered

- **Express 4.x** — most widely familiar, but 2–3× slower than Fastify and lacks built-in
  schema validation. Input validation would require a separate library (Joi, Zod, etc.).
- **Hapi 21.x** — solid framework with built-in validation, but more ceremony for a single
  endpoint; smaller community than Express/Fastify.
- **Bare `node:http` module** — lowest overhead but requires hand-rolling routing, JSON
  serialisation, and validation; excessive boilerplate for no meaningful gain at this scale.

## Consequences

**Positive**
- Built-in AJV JSON-schema validation on query parameters — eliminates a separate validation
  library and satisfies security input-validation requirements automatically.
- ~40,000 req/s (benchmarked); comfortably meets the <50 ms p95 SLO.
- Integrated pino logger for structured JSON logging.
- Plugin ecosystem: `@fastify/sensible`, future `@fastify/metrics` for Prometheus.
- First-class TypeScript support for future migration.

**Negative / trade-offs**
- Less universally familiar than Express; onboarding takes ~30 minutes for new contributors.
- Fastify-specific plugin API differs from Express middleware pattern.

**Neutral / follow-ups**
- Pin Fastify to `^4.x` in `package.json`; review for v5 upgrade when LTS status is clear.
