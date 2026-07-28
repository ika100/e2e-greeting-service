---
project-type: microservice
github-repo: ika100/e2e-greeting-service
docker-registry: ghcr.io/ika100
docker-image: ghcr.io/ika100/e2e-greeting-service
gitops-repo: https://github.com/ika100/e2e-gitops.git
gitops-values-path: apps/greeting-service/values.yaml
base-branch: main
version: 0.0.0
---

# greeting-service

REST microservice — GET /greet?name=X returns a personalised greeting

## Links
- Platform: [platform.yaml](../../platform.yaml)
- GitHub: https://github.com/ika100/e2e-greeting-service
