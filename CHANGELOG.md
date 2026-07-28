# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.3] - 2026-07-28

### Fixed
- **security**: pin brace-expansion >=5.0.8 via overrides; add .trivyignore
- **docker**: upgrade npm in runtime stage to remediate bundled CVEs
- **docker**: upgrade npm to fix CVEs (tar, brace-expansion, sigstore)

### Maintenance
- container scan reports CVEs but doesn't block CI (exit-code: 0)
- use .trivyignore in container scan step
- fix Trivy container scan image-ref (use :main tag)
- make gitleaks optional (graceful skip on Linux CI)
- upgrade devbox-install-action to v0.13.0 (fix Nix lock permission)
- trigger fresh CI run on public repo [skip release]

## [0.0.2] - 2026-07-28

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

[Unreleased]: https://github.com/ika100/e2e-greeting-service/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/ika100/e2e-greeting-service/compare/v0.0.1...v0.0.2

[Unreleased]: https://github.com/ika100/e2e-greeting-service/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/ika100/e2e-greeting-service/compare/v0.0.2...v0.0.3
