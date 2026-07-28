# Greeting Capability Specification

## Purpose

Expose a single HTTP endpoint that accepts a person's name and returns a personalised
greeting string. The service is stateless; each request is independent.

---

## Requirements

### Requirement: Return personalised greeting

The system SHALL accept a `name` query parameter on `GET /greet` and return a JSON response
containing a personalised greeting that includes the provided name.

#### Scenario: Happy-path greeting
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=Alice`
- **THEN** the response status is `200 OK`
- **AND** the `Content-Type` header is `application/json`
- **AND** the response body is `{ "greeting": "Hello, Alice!" }`

#### Scenario: Name with special characters
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=María`
- **THEN** the response status is `200 OK`
- **AND** the response body contains `"María"` in the greeting field

#### Scenario: Name with leading/trailing whitespace
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=%20Alice%20` (URL-encoded spaces)
- **THEN** the response status is `200 OK`
- **AND** the greeting trims leading/trailing whitespace so the body reads `"Hello, Alice!"`

---

### Requirement: Reject missing name parameter

The system SHALL return a `400 Bad Request` response when the `name` query parameter is
absent or empty.

#### Scenario: Missing name parameter
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet` (no `name` parameter)
- **THEN** the response status is `400 Bad Request`
- **AND** the response body is `{ "error": "name query parameter is required" }`

#### Scenario: Empty name parameter
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=`
- **THEN** the response status is `400 Bad Request`
- **AND** the response body is `{ "error": "name query parameter is required" }`

---

### Requirement: Enforce maximum name length

The system SHALL reject names longer than 100 characters with a `400 Bad Request` to
prevent oversized inputs.

#### Scenario: Name exceeds maximum length
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=<string of 101 characters>`
- **THEN** the response status is `400 Bad Request`
- **AND** the response body is `{ "error": "name must not exceed 100 characters" }`

#### Scenario: Name at maximum length
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=<string of exactly 100 characters>`
- **THEN** the response status is `200 OK`
- **AND** the greeting contains the full 100-character name

---

### Requirement: Expose a health probe endpoint

The system SHALL expose `GET /health` returning `200 OK` with `{ "status": "ok" }` so
Kubernetes liveness and readiness probes can verify the service is up.

#### Scenario: Health probe when service is up
- **GIVEN** the service is running
- **WHEN** a client sends `GET /health`
- **THEN** the response status is `200 OK`
- **AND** the response body is `{ "status": "ok" }`

---

### Requirement: Return 404 for unknown routes

The system SHALL return `404 Not Found` for any request path other than `/greet` and
`/health`, with a consistent JSON error body.

#### Scenario: Unknown route
- **GIVEN** the service is running
- **WHEN** a client sends `GET /unknown`
- **THEN** the response status is `404 Not Found`
- **AND** the response body is `{ "error": "Not Found" }`

---

### Requirement: Respond within latency budget

The system SHOULD return a response within 50 ms at the p95 percentile under normal
operating load (up to 100 concurrent requests).

#### Scenario: Low-latency response under load
- **GIVEN** 100 concurrent clients each sending `GET /greet?name=Test`
- **WHEN** they send requests simultaneously for 10 seconds
- **THEN** the p95 response time is ≤ 50 ms
- **AND** the error rate is 0%
