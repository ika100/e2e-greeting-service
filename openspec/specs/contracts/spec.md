# API Contract Specification

## Purpose

Document the public HTTP API contract of the greeting-service so that dependent services
(principally `ika100/e2e-frontend`) can integrate against a stable, unambiguous interface.

---

## Endpoint: GET /greet

### Request

| Component | Value |
|-----------|-------|
| Method | `GET` |
| Path | `/greet` |
| Query params | `name` (string, required, 1–100 characters) |
| Headers | none required |
| Body | none |

**Example request:**
```
GET /greet?name=Alice HTTP/1.1
Host: greeting-service
```

### Response — Success

| Component | Value |
|-----------|-------|
| Status | `200 OK` |
| Content-Type | `application/json` |
| Body schema | `{ "greeting": "<string>" }` |

**Example response body:**
```json
{ "greeting": "Hello, Alice!" }
```

### Response — Validation Error

| Component | Value |
|-----------|-------|
| Status | `400 Bad Request` |
| Content-Type | `application/json` |
| Body schema | `{ "error": "<human-readable message>" }` |

**Example error bodies:**
```json
{ "error": "name query parameter is required" }
{ "error": "name must not exceed 100 characters" }
{ "error": "name contains invalid characters" }
```

---

## Endpoint: GET /health

### Request

| Component | Value |
|-----------|-------|
| Method | `GET` |
| Path | `/health` |
| Query params | none |
| Body | none |

### Response

| Component | Value |
|-----------|-------|
| Status | `200 OK` |
| Content-Type | `application/json` |
| Body | `{ "status": "ok" }` |

---

## Error Response Envelope

All error responses from the greeting-service share the same shape:

```json
{
  "error": "<string: human-readable description>"
}
```

HTTP status codes used:

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Client error — invalid or missing input |
| `404` | Route not found |
| `500` | Internal server error (should not occur in normal operation) |

---

## Requirements

### Requirement: Stable response schema

The system SHALL maintain the `{ "greeting": "<string>" }` schema for `GET /greet` responses
across all patch and minor releases. Breaking changes require a major version bump.

#### Scenario: Consumer integration
- **GIVEN** `ika100/e2e-frontend` calls `GET /greet?name=Alice`
- **WHEN** the response is received
- **THEN** the JSON body contains the key `greeting` with a string value that includes
  "Alice"
- **AND** no other required fields are added without a major version bump

### Requirement: Consistent error envelope

The system SHALL always return `{ "error": "<message>" }` for non-2xx responses, never a
bare string or HTML error page.

#### Scenario: Error response is JSON
- **GIVEN** a client sends an invalid request (e.g., missing `name`)
- **WHEN** the service responds with `400 Bad Request`
- **THEN** the `Content-Type` header is `application/json`
- **AND** the body is a valid JSON object with an `error` key

---

## Integration Notes for Consumers

- **Frontend (`ika100/e2e-frontend`):** Call `GET /greet?name=<encodedName>` and render
  `response.greeting`. Handle `400` gracefully (show a fallback message).
- **Service discovery:** In Kubernetes, the service is reachable at
  `http://greeting-service:<port>/greet` within the cluster.
- **Environment variable:** The frontend should configure `VITE_GREETING_SERVICE_URL`
  (or equivalent) to point to the greeting-service base URL.
