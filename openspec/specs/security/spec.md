# Security Capability Specification

## Purpose

Define the security posture of the greeting-service: input validation to prevent injection,
safe handling of all inbound data, and container/supply-chain hardening.

---

## Requirements

### Requirement: Sanitise and validate all input

The system SHALL validate the `name` query parameter to ensure it contains only printable
characters (no control characters, null bytes, or script injection sequences) before
including it in the response.

#### Scenario: Injection attempt via name parameter
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=<script>alert(1)</script>`
- **THEN** the response status is `400 Bad Request`
  **OR** the returned greeting reflects the literal string without interpreting it as markup
- **AND** no script tag appears in a form that could be interpreted by a browser consuming
  the JSON response

#### Scenario: Null-byte injection attempt
- **GIVEN** the service is running
- **WHEN** a client sends a request with `name` containing a null byte (`\x00`)
- **THEN** the response status is `400 Bad Request`
- **AND** the response body is `{ "error": "name contains invalid characters" }`

#### Scenario: Normal alphanumeric name passes validation
- **GIVEN** the service is running
- **WHEN** a client sends `GET /greet?name=Bob`
- **THEN** validation passes and the response status is `200 OK`

---

### Requirement: Serve responses over HTTPS in production

The system SHALL be deployed behind a TLS-terminating ingress controller so that all
traffic between clients and the service is encrypted in transit.

#### Scenario: HTTP request in production
- **GIVEN** the service is deployed in the production Kubernetes cluster with TLS ingress
- **WHEN** a client sends a plain HTTP request to the service hostname
- **THEN** the ingress controller redirects to HTTPS (301/302) or rejects the plain request

#### Scenario: HTTPS request succeeds
- **GIVEN** the TLS ingress is configured
- **WHEN** a client sends `GET https://<hostname>/greet?name=Alice`
- **THEN** the response is `200 OK` with a valid TLS certificate

---

### Requirement: Run container as non-root

The system SHALL run the application process inside the Docker container as a non-root
user (UID ≥ 1000) to limit blast radius if the process is compromised.

#### Scenario: Container process ownership
- **GIVEN** the Docker image is built from the project Dockerfile
- **WHEN** the container is started and `id` is executed inside it
- **THEN** the output shows a non-root user (UID ≠ 0)

---

### Requirement: Ship a minimal container image free of CRITICAL/HIGH CVEs

The system SHALL produce a Docker image that, at the time of release, contains no
CRITICAL or HIGH severity CVEs as reported by Trivy.

#### Scenario: Trivy scan on built image
- **GIVEN** the Docker image is built (`docker build .`)
- **WHEN** `trivy image --severity CRITICAL,HIGH --exit-code 1 <image>` is executed
- **THEN** the command exits with code 0 (no CRITICAL/HIGH CVEs found)

---

### Requirement: No secrets committed to the repository

The system SHALL not contain any API keys, tokens, passwords, or other secrets in
committed source code, configuration files, or history.

#### Scenario: Gitleaks scan on repository
- **GIVEN** the repository contains all committed source files
- **WHEN** `gitleaks detect --no-git --quiet` is run
- **THEN** gitleaks exits with code 0 (no secrets detected)

---

### Requirement: No CRITICAL/HIGH SAST vulnerabilities

The system SHALL pass CodeQL static analysis with zero CRITICAL or HIGH severity findings
on every PR and push to `main`.

#### Scenario: CodeQL analysis on PR
- **GIVEN** a pull request is opened targeting `main`
- **WHEN** the CI `security` job runs CodeQL with `queries: security-extended`
- **THEN** zero CRITICAL or HIGH alerts are uploaded to GitHub Security tab
- **AND** the job exits successfully, allowing PR merge

---

### Requirement: No CRITICAL/HIGH dependency CVEs

The system SHALL have no CRITICAL or HIGH severity CVEs in its npm dependency tree, as
verified by `npm audit --audit-level=high` and Trivy filesystem scan.

#### Scenario: npm audit on CI
- **GIVEN** the CI `security` job runs
- **WHEN** `npm audit --audit-level=high` is executed
- **THEN** the command exits with code 0

#### Scenario: Trivy filesystem scan on CI
- **GIVEN** the CI `security` job runs
- **WHEN** `trivy fs --severity CRITICAL,HIGH --exit-code 1 .` is executed
- **THEN** the command exits with code 0
