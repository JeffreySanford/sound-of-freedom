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

  Job queue

  - `POST /jobs` — submit a job to the orchestrator Redis stream; returns jobId and 202 Accepted. Payload: { narrative, duration, model, options }
  - `GET /jobs/:id` — get job status and metadata from Redis
  - The orchestrator exposes a `/metrics` endpoint for Prometheus metrics

  Worker and storage

  - Worker: A separate orchestrator worker (`orchestrator-worker`) reads jobs from `jobs:stream` using Redis streams XREADGROUP.
    The worker is started using `npm run start:worker`.
  - Traceability: The worker propagates a `X-Request-Id` header when calling external services (like `jen1`) and when
    posting job reports back to the API. If the job already contains a `requestId`, the worker will use it; otherwise it
    generates and persists a `requestId` in the job record.
  - The worker will process jobs, call `jen1`, and write generated artifacts to `ARTIFACT_DIR` (default `/app/uploads`).
  - For production, use an object storage (S3/GCS) and set appropriate secrets in the environment.
    The worker should upload artifacts and store artifact URLs in the job metadata in Redis.

  API endpoints
  - `GET /compose` — status and a simple test orchestration using GET
  - `POST /compose` — orchestrate a generation request by forwarding payload to `jen1` `/generate` and returning the result

Docker

The `docker-compose.yml` provides a `redis` service, an `ollama` container, and the orchestrator service.
The orchestrator depends on `redis` and `ollama` to manage orchestration and model access.

Health and metrics

- `GET /health` returns `{status: 'ok'}`

**Note**: Orchestrator uses Redis to cache intermediate orchestration results for faster lookup.
Artifacts are stored in a shared object store (S3 or GCS) rather than in the service container.
