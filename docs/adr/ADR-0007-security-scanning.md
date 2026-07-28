# ADR-0007: Security Scanning with CodeQL + Trivy + Gitleaks

- **Status:** Accepted
- **Date:** 2025-01-28
- **Deciders:** Platform team
- **Related:** RFC-0001, openspec/specs/security/spec.md, docs/ci-cd.md

## Context

The security spec mandates: no CRITICAL/HIGH SAST vulnerabilities, no HIGH/CRITICAL
dependency CVEs, no secrets in the repository, and a CVE-free container image at release.
Tools must integrate natively with GitHub Actions and upload results to GitHub Security tab.

## Decision

We will use three complementary scanning tools:

1. **CodeQL** (SAST) — GitHub-native; JavaScript/Node.js query set `security-extended`.
2. **Trivy** (SCA + container scan) — filesystem scan on every PR; image scan after build.
3. **Gitleaks** (secrets) — run via `devbox run security` on every PR and push.

Additionally, `npm audit --audit-level=high` runs as part of `devbox run security`.

## Alternatives Considered

- **Snyk** — powerful SCA tool but requires an additional SaaS account and API key secret;
  CodeQL + Trivy covers the same ground without extra credentials.
- **Semgrep** — excellent SAST but CodeQL is already free and native to GitHub; two SAST
  tools would create duplicate noise.
- **TruffleHog** (instead of Gitleaks) — entropy-based detection is strong but Gitleaks is
  already in `devbox.json`; keeping the existing tool.
- **OWASP Dependency-Check** (instead of Trivy) — heavier, slower, JVM dependency; Trivy
  is faster and covers both filesystem and container scanning.

## Consequences

**Positive**
- All three tools upload SARIF to GitHub Security tab — unified view of findings.
- CodeQL is zero-cost for public/GH-Advanced-Security repos.
- Trivy covers both dependency (filesystem) and OS-level (container) CVEs in one tool.
- Gitleaks + npm audit run locally via `devbox run security` — developers can catch issues
  before pushing.
- CRITICAL/HIGH findings block PR merge; enforcement via required CI status check.

**Negative / trade-offs**
- CodeQL adds ~2–4 minutes to CI runtime (autobuild step).
- Trivy container scan runs only after image is built (post-build gate, not PR gate for
  container CVEs).

**Neutral / follow-ups**
- Configure GitHub branch protection to require the `security` CI job to pass.
- Review Trivy findings weekly; patch policy: CRITICAL within 24 h, HIGH within 7 days.
- Enable GitHub Secret Scanning (built-in) in repo settings as a second layer.
