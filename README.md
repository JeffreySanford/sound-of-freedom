# sound-creator

Sound Creator monorepo based on Nx. It contains an Angular frontend with Material 3, a NestJS API backend, and three microservices (jen1, muscgen, orchestrator) packaged in Docker containers.

## Structure

* apps/frontend — Angular app
* apps/api — NestJS API
* apps/jen1 — Small Node microservice
* apps/muscgen — Small Node microservice
* apps/orchestrator — Orchestrates microservices (calls jen1 and muscgen)

## Setup

1. Install dependencies at workspace root:

```bash
pnpm install
```

1. Start services locally with docker-compose:

```bash
docker-compose up --build
```

* Frontend will be accessible at <http://localhost:4200>
* API at <http://localhost:3333>
* Orchestrator at <http://localhost:4000>
* jen1 at <http://localhost:4001>
* muscgen at <http://localhost:4002>

## Development without Docker (quick start)

* Run backend locally:

```bash
pnpm nx serve api
```

* Run Angular frontend for development (this doesn't build with Nx Angular plugin but will still serve a static build using http-server):

```bash
pnpm nx run frontend:serve
```

## Material 3

The frontend has `@angular/material` installed in the top-level package.json; you can use Angular Material components in the app module.

## Adding Nx tasks & plugins

This is a minimal scaffold. For typical Nx workflows you can add project-specific config and use Nx generators:

```bash
pnpm nx generate @nrwl/angular:application frontend
pnpm nx generate @nrwl/nest:application api
```

These create richer, fully configured Nx projects if you prefer to re-generate the apps using Nx CLI.

## Docker

* Each app has a Dockerfile in `apps/<app>/Dockerfile` and the root `docker-compose.yml` builds all containers.

***

This repo was scaffolded to help accelerate development of audio-generation flows and orchestration. Feel free to extend and integrate with audio-processing libraries.

## Initialize and Git

To initialize the repository and make a first commit locally:

```bash
./scripts/init-repo.sh
```

If you prefer to do this manually:

```bash
git init
git add .
git commit -m "Initial scaffold of sound-creator Nx workspace"
```

## Next Steps

* Run `pnpm run nx` to access Nx CLI locally.
* Use `pnpm nx generate` to create new apps or libs with Nx generators.

## Markdown Linting & Commit Hooks ✅

* The repository enforces Markdown lint rules with `markdownlint-cli2` and a pre-commit hook using Husky + lint-staged.
* Run lint checks locally with:

```bash
pnpm run lint:md
```

* To auto-fix fixable issues before committing, use:

```bash
pnpm run lint:md:fix
```

* Hooks are installed automatically on `pnpm install` (which triggers the `prepare` script to activate Husky). Commits are blocked if lint fails for staged Markdown files.

Services & orchestration

* `jen1` — metadata/lyrics generation microservice (apps/jen1)
* `muscgen` — music generation microservice (apps/muscgen) — typically Python/torch based; Ubuntu recommended for GPU use
* `ollama` — local LLM host for large models (apps/ollama) — Ubuntu recommended; may require host GPU runtime and large vRAM
* `orchestrator` — Redis-backed orchestration service integrates `jen1` & `muscgen` and provides endpoints for job submission and monitoring

Use `docker-compose up --build` to build and run the services locally (orchestrator depends on Redis and Ollama if enabled).
ICENSING\_CI.md](LICENSING_CI.md)** - License compliance and CI
* **[LEGAL\_AND\_LICENSE\_AUDIT.md](LEGAL_AND_LICENSE_AUDIT.md)** - Legal compliance

## 🔍 Quick Navigation

### For New Developers

1. Read [SETUP.md](SETUP.md) for environment setup
2. Follow [DEV\_ONBOARDING.md](DEV_ONBOARDING.md) for onboarding
3. Review [CODING\_STANDARDS.md](CODING_STANDARDS.md) for standards
4. Check [API\_REFERENCE.md](API_REFERENCE.md) for API understanding

### For API Consumers

* **[API\_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
* Interactive Swagger UI at `http://localhost:3000/api/docs`

### For Contributors

* **[DEVELOPMENT\_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** - How to contribute
* **[TESTING\_CHECKLIST.md](TESTING_CHECKLIST.md)** - Testing requirements
* **[ARCHITECTURE.md](ARCHITECTURE.md)** - System understanding

## 📖 Reading Guide

* **Start Here**: If you're new, begin with [SETUP.md](SETUP.md)
* **API First**: For integration work, start with [API\_REFERENCE.md](API_REFERENCE.md)
* **Deep Dive**: For architecture understanding, read [ARCHITECTURE.md](ARCHITECTURE.md)
* **Contributing**: Review [CODING\_STANDARDS.md](CODING_STANDARDS.md) and [DEVELOPMENT\_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)

## 🔗 External Resources

* [Nx Workspace Guide](NX_WORKSPACE_GUIDE.md) - Nx monorepo tooling
* [PNPM Guide](PNPM.md) - Package management
* [Material Design Guide](MATERIAL_MODULES.md) - UI component library

## 📞 Support

* **Issues**: Check [TROUBLESHOOTING.md](TROUBLESHOOTTING.md) first
* **Development Help**: See [DEVELOPER\_HEALTH\_CHECK.md](DEVELOPER_HEALTH_CHECK.md)
* **Architecture Questions**: Refer to [ARCHITECTURE.md](ARCHITECTURE.md)

***

**Legend**: 📚 Documentation | 🚀 Getting Started | 🏗️ Architecture | 🔧 Development | 📡 API | 🎵 Features | 🗄️ Infrastructure | 🔒 Security | 🚀 Deployment | 📋 Quality
