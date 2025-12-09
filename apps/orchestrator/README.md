# orchestrator — service and job queue

Overview

The `orchestrator` service coordinates `jen1` (metadata) and `muscgen` (audio generation).
It uses Redis as a job queue and as a cache for intermediate results.

Commands

- `pnpm start` starts the orchestrator locally

Configuration

- Environment variables:

  - `JEN1_URL` — URL of the `jen1` service
  - `MUSCGEN_URL` — URL of the `muscgen` service
  - `REDIS_URL` — Redis connection string
  - `OLLAMA_URL` — Ollama LLM host (if enabled)

Docker

The `docker-compose.yml` provides a `redis` service, an `ollama` container, and the orchestrator service.
The orchestrator depends on `redis` and `ollama` to manage orchestration and model access.

Health and metrics

- `GET /health` returns `{status: 'ok'}`

**Note**: Orchestrator uses Redis to cache intermediate orchestration results for faster lookup.
Artifacts are stored in a shared object store (S3 or GCS) rather than in the service container.
