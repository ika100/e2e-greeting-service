# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-07-28

### Maintenance
- foundational setup — greeting-service v0.1.0 scaffold
- auto-commit pre-build state [pi-build]
- add devbox environment
- initialise greeting-service service

## [0.0.1] - 2026-07-28

### Maintenance
- foundational setup — greeting-service v0.1.0 scaffold
- auto-commit pre-build state [pi-build]
- add devbox environment
- initialise greeting-service service

## [0.0.1] - 2026-07-28

### Maintenance
- foundational setup — greeting-service v0.1.0 scaffold
- auto-commit pre-build state [pi-build]
- add devbox environment
- initialise greeting-service service

### Added
- Initial project scaffolding and structure
- `GET /greet?name=X` endpoint returning personalised greeting
- `GET /health` health probe endpoint
- Input validation (missing name, max length 100, invalid characters)
- Multi-stage Dockerfile (node:22-alpine, non-root user)
- GitHub Actions CI pipeline (security, test, build, release, gitops-update jobs)
- Gitleaks + Trivy + CodeQL security scanning
- Devbox environment setup

[Unreleased]: https://github.com/ika100/e2e-greeting-service/compare/HEAD

[Unreleased]: https://github.com/ika100/e2e-greeting-service/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/ika100/e2e-greeting-service/releases/tag/v0.0.1
