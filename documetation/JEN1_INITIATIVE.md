# Initiative: Expand Jen1 + Orchestrator + UI Integration

This initiative defines the scope, design, and next steps to fully integrate `jen1` with the orchestrator and the API, and enable a frontend selector and background
job system for production generation workflows.

Goals

- Provide a reliable, scalable job queue / worker system for long-running model inference
- Integrate safe model deployment (Python-based images for PyTorch) and secrets for model weights and API keys
- Add a UI workflow for choosing generator models, with model-specific options, and persist user preferences
- Provide production-grade metrics, logging, and storage of artifacts (S3/GCS)
- Ensure the frontend can launch both synchronous generation and background jobs and receive progress via WebSockets

Design decisions (current PoC implementation)

- Orchestrator: Node-based service with Redis as job queue. Implements `POST /jobs` -> returns `jobId`, `GET /jobs/:id` -> read job details. Adds `/metrics` endpoint
via `prom-client` for Prometheus.
  - Orchestrator worker: Redis Streams consumer group-based worker (`XREADGROUP`) that consumes messages on `jobs:stream`, calls `jen1` `/generate`, stores result
  in artifact (uploads) folder and reports progress/completion to the API via `POST /jobs/report`.
- jen1: PoC `POST /generate` (returns JSON structure). Replace with Python model runtime for actual ML models; example Python `Dockerfile.python` provided.
- API: Added `JobsController` to accept job reports and emit real-time updates using `JobsGateway` (Socket.IO). Also proxies job queries to orchestrator.
- Frontend: Adds a generator selector, generator-specific options (e.g., `lyrics-first`, `melody-only` for `jen1`), and `Async job` toggle; uses WebSocket service
to subscribe to job events when a job is submitted.

Security and secrets

- Use robust secret management for model credentials and S3 access (e.g., environment variables, cloud secret stores, or Vault).
- Prefer not to bake model weights into container images. Instead, fetch and cache weights at startup or read from an object store with appropriate access controls.

Object storage recommendations

- Use S3/GCS for artifacts and model weight distribution; attach an object store bucket to orchestrator and workers.
- Write artifacts to a transient upload directory then upload to object storage and return signed URL or public URL depending on privacy requirements.

Monitoring and metrics

- Orchestrator exposes `/metrics` for Prometheus with basic counters (jobs submitted/completed). Add additional metrics like job processing duration, queue length,
and error rates.
- Add health checks (`/health`) for orchestrator and jen1.
- Use structured logging (e.g., `pino` or `winston`) and error tracking (Sentry or similar) for production observability.

Scalability & Reliability Notes

- Use Redis streams, priority queues, or a dedicated queuing system (e.g., RabbitMQ, Celery / Redis Queue) for high-scale job processing and job retry logic.
- Split worker process from tracking/orchestrator API if you need many concurrent workers and horizontal scaling.
- Ensure workers and orchestrator verify JWT tokens for user ownership of jobs before emitting job events.

Implementation roadmap (next steps)

1. Replace PoC jen1 generator with a Python-based slot that runs PyTorch/ONNX inference and supports GPU. Add model weight handling in startup via env variable
(MODEL_S3_PATH) and environment secrets or cloud IAM. (Status: PoC CPU server implemented in `apps/jen1/src/server.py`, `Dockerfile.python` added; GPU template
added `Dockerfile.gpu`.)
2. Implement robust job processing with Redis streams and distributed workers; add job retries and failure handling. (Status: PoC worker implemented at
`apps/orchestrator/src/worker.js` using Redis Streams; dead-letter queue added; concurrency support added via `WORKER_CONCURRENCY`.)
3. Integrate S3/GCS for artifacts and update orchestrator worker to upload artifacts and return signed URLs in job metadata.
4. Implement an orchestrator configuration layer for scaling (e.g., concurrency, worker pool size, concurrency per model) and a helm chart / docker-compose to
start multiple workers.
5. Improve the API to persist jobs in a DB (e.g., MongoDB) and to return a standard job model with statuses and artifact URLs.
6. Implement the frontend job monitoring view, the full Song Generation/Model Selector, and model-specific UX with per-model option prompts. Add SSO and per-user
jobs view.

Security & Compliance

- Audit user-submitted content and apply filtering for model usage and safety. Implement content policy controls per downstream model and content review workflows
if necessary.

Testing and CI

- Add integration tests to verify PoC flow (API -> orchestrator -> jen1) and end-to-end job submission + completion for non-GPU small models in CI.
- Add a scheduled test suite for smoke testing GPU flows if using GPU-enabled CI runners or dedicated hardware.

Notes

- This initiative is intentionally pragmatic. The PoC demonstrates the core end-to-end connectivity: UI to API to Orchestrator to Jen1, with jobs and progress reporting.
- The next development steps will require infra decisions for object storage, GPU-enabled CI/Runners, and secure secret handling.
