# HarmonIA TODO / Sprint Board

Last Updated: 2025-12-10 17:05:00 UTC

- ## Current Status

- Sprint: Jen1 + Orchestrator GPU & Security
- Sprint Lead: @jeffreysanford
- Sprint window: 2025-11-30 — 2025-12-14
- Notes: PoC complete; ongoing work to harden security (JWT and orchestrator tokens) and provide GPU runtimes & caching.
- Notes: Also integrating persistence and S3 artifact flows for generated artifacts and model caching.

## Current Initiative (Primary)

Jen1 + Orchestrator + UI Integration

- Goal: Add GPU-capable jen1 runtime, orchestrator worker for long running generation, robust job persistency & notification to frontend.
- Status: In-progress
- Owners: backend, frontend, infra teams

## Next Steps (High Priority)

1. Enforce strict orchestrator worker token validation for `POST /jobs/report` in production (REQUIRE_ORCHESTRATOR_JWT). — Backend
    Owner: Backend (Auth & Jobs)
    Priority: Critical
    Notes: Flag already exists; enforce by default in production and add CI checks.

1. Add an Admin-only service token generator API and dev rotation for orchestrator workers (`POST /auth/service-tokens`).
    Owner: Backend / DevOps
    Priority: High
    Notes: Implement endpoint and rotation; add to vault or secret manager.

1. Implement robust S3/model caching for jen1 (MODEL_S3_PATH, MODEL_CACHE_DIR), with integrity and cache eviction.
    Owner: Jen1 / Infra
    Priority: High
    Notes: PoC added; implement checksum verification and LRU-style eviction.

1. Harden worker & orchestrator pipeline (retries, DLQ, metrics, and service health):
    Owner: Orchestrator / Backend / Infra
    Priority: High
    Subtasks:
        - Add Prometheus metrics for queue length, worker latency, and S3 upload errors.
        - Add DLQ alerting and backoff policies.

1. Add e2e tests & CI smoke tests for the full job lifecycle (API -> orchestrator -> worker -> jen1) plus an optional GPU smoke test for infra.
    Owner: QA / CI / Backend
    Priority: High
    Notes: Add a GitHub Action job with a `RUN_GPU_SMOKE` toggle and use cached model artifacts to speed builds.

1. Add developer debug docs & start script docs: document `--debug` option, `--compose-file`, and `API_DEBUG_COMMANDS` env variable; include example commands
and recommended compose env configuration.
    Owner: Docs/Dev
    Priority: Medium
    Notes: Make sure README, `documetation/ENVIRONMENT_SETUP.md`, `documetation/DEV_ONBOARDING.md`, and `documetation/API_REFERENCE.md` have consistent examples
    and instructions.
    Status: Completed (2025-12-10 17:05:00 UTC)
1. Add CI artifact upload step to capture `tmp/logs` on E2E or CI failures (include log rotation and retention policy). — CI
    Owner: CI/Infra
    Priority: High
    Notes: Upload `tmp/logs` artifacts for debugging failures and support `--ci` flag automation.

1. Replace remaining `console.*` usages in frontend components and docs with `LoggerService`.
    Owner: Frontend
    Priority: High
    Notes: Ensure `HttpClientTestingModule` is added to tests where `LoggerService` is injected.
    Owner: Frontend
    Priority: High
    Notes: Complete migration across all runtime code; documentation examples that intentionally demonstrate `console.*` may remain.

1. Add Admin Logs UI and tests to expose `GET /internal/logs` and file list/tail endpoints within a secure admin dashboard.
    Owner: Frontend / Backend
    Priority: Medium
    Notes: Protect access with `ADMIN_LOGS_TOKEN` in admin-only UIs and add end-to-end tests for reading and tailing logs via the API.

## Backlog (Lower Priority)

- Split large reducers/effects into feature modules to reduce bundle sizes and add per-feature lazy-loading. — Frontend
- Add observability: Prometheus metrics for worker latency, queue length, S3 upload errors. — Infra
- Add SSO & per-user jobs view / access controls for job ownership. — Frontend / Backend
- Add Helm chart & production manifests for worker pools and GPU nodes. — Infra

## Logging & Observability Follow-ups

- [ ] Add retention policy for local file logs and Mongo/DB log sink, and optionally add S3/ELK sink for long-term archival. — Infra
- [ ] Add CI tests for the Logs API endpoints (list, tail, query, delete) and integrate with the mock Ollama server for CI-safe log generation. — QA/Backend
- [ ] Add Admin UI for logs, with pagination, tailing, and basic search of structured logs. — Frontend
- [ ] Add dashboard / monitoring for log metrics and ingestion rate. — Infra

## Completed (This Sprint so far)

- Completed as of: 2025-12-10 17:05:00 UTC

- [x] Remove PoC inline jen1: Added Python FastAPI PoC and GPU template (Dockerfiles, debug endpoints). — Backend
- [x] Orchestrator Redis streams worker with retries & dead-letter queue. — Backend
- [x] Orchestrator worker artifact write & optional S3 upload. — Backend
- [x] API JobsController + JobsService with MongoDB persistence. — Backend
- [x] Frontend generator selection, `async` toggle, and job monitoring via WebSockets. — Frontend
- [x] Basic dev tooling: `scripts/auth/generate-orchestrator-token.js` and allow dev generation of tokens for worker. — DevOps/Infra
- [x] Fix NX parse error, package.json errors, SASS build issue and Typescript errors observed in start:all flow. — All

## Current Sprint: Jen1 + Orchestrator GPU & Security

Completed snapshot: 2025-12-10 17:05:00 UTC

- [x] Fix NX JSON parse error in `apps/orchestrator/package.json` (daemon parse issue)
- [x] Orchestrator: Optional S3 artifact upload + artifactUrl in job record
- [x] API: Persist job record on job submission and accept `POST /jobs/report` for status updates
- [x] Worker: Redis Streams consumer group worker with concurrency, retries, dead-letter
- [x] Worker: Propagate X-Request-Id header to `jen1` and API report calls, and persist generated requestId on job record
- [x] Jen1: GPU template & optional model loading via Hugging Face + `/debug/model` endpoint
- [x] Frontend & scripts: generator selector, async toggle, `poc:jen1`, `check-torch` script
- [x] WebSocket: `JobsGateway` uses JwtService to verify token on connect
- [x] SongsController: Added `JwtAuthGuard` to ensure auth'd user submit generation requests
- [x] Ollama integration: Added `OllamaService` with `probe()` health checks
- [x] Ollama integration: `chooseAvailableModel()` auto-selection and per-model mappers
- [x] Ollama integration: fallback to sample metadata and improved lyric cleaning
- [x] Dev UX: `tools/scripts/start-all-docker.js` friendlier messages when no compose file is found
- [x] Dev UX: `.env.debug` support and improved compose-file handling
- [x] Docker: `apps/ollama/entrypoint.sh` auto-pull support (`OLLAMA_AUTO_PULL`, `OLLAMA_PULL_MODELS`)
- [x] Docker: Add `ollama-real` container with commonly used models installed in dev
- [x] Ollama mock server: Created `apps/ollama/docker/mock-server.js` for CI-safe behavior
- [x] PoC scripts: Added `scripts/poc/send-narrative-via-api.js` and `scripts/ollama/test-ollama-lyrics.js` to test music generation flows via scripts
- [x] Lyric generation quality: Added `cleanLyrics()` in `OllamaService` to reduce repetition and a sample fallback generator to avoid noisy outputs
- [x] Mappers: Added `mappers.ts` with per-model normalization and updated mapping for `mistral:7b`, `deepseek-coder:6.7b`, `minstral3` (ready if available)

- [x] Logging: Added `libs/logging` for Winston based logger with optional Mongo transport (winston-mongodb) and daily rotation via `winston-daily-rotate-file`.
- [x] Logging: Integrated `NestWinstonLogger` into the API and used structured logging in `apps/api` services (e.g., `OllamaService`, `StemExportService`, `LibraryService`).
- [x] Logging: Added Node-level helper `tools/logging/node-logger.js` and migrated runtime scripts and services (orchestrator, worker, jen1, scripts) to use it.
- [x] Frontend: Added `LoggerService` + `LoggingInterceptor` and wired frontend to POST logs
    to `POST /internal/logs` (config-driven). Replaced `console.*` in major components.
- [x] API: Implemented `LogsService` and `LogsController` with endpoints for ingestion, query, delete, and stats.
    Added file list and file tailing endpoints.
    Added `LOG_TAIL_MAX_LINES` / `LOG_TAIL_MAX_BYTES` and `ADMIN_LOGS_TOKEN` protection.
- [x] CI/Dev: Updated `docker-compose.e2e.yml`, `apps/api/Dockerfile.e2e`, and scripts to support `LOG_DIR` and log rotation.
    Added ignoring `tmp/logs` to `.gitignore` and untracked local logs in repo index.
- [x] Tests & Lint: Updated tests to include `HttpClientTestingModule` where needed and fixed lints; built and ran tests successfully.

- [ ] Module splitting backlog:

## Follow-ups (just added)

- Add `@nestjs/testing` to devDependencies to ensure unit tests run in CI. — Backend
- Add scripted E2E tests (no UI) that validate the dev pipeline using the mock Ollama server and API health endpoints. — QA/Backend
- E2E step: start the mock server
- E2E step: start the API server via script
- E2E step: call `GET /api/__health/ollama` and `POST /api/songs/generate-metadata`
- E2E step: validate response shapes and HTTP status codes
- Fix Markdown lint errors across `apps/ollama/README.md`, `apps/ollama/docker/README.md`, and `scripts/docker/README.md`.
- Also validate `documetation/*` for line lengths, tabs, and multiple blank lines. — Docs
- Re-run NX cache & rebuild to flush stale model default references (`minstral3`, `mistral3:6.5b`) and verify that `mistral:7b` is the effective default. — Infra
- Add CI job to run e2e script and ensure `OLLAMA_AUTO_PULL` optional behavior is covered; keep mock path for CI where GPU or model pulls are not desired. — CI

  - Move large reducers and effects to feature modules (already done for songGeneration and library) to reduce main bundle size.
  - Split heavy Material imports into feature-specific Material modules and only import into the app root the modules used by the layout.
  - Review feature module sizes using Webpack stats and consider further lazy-loading to reduce initial JS.
