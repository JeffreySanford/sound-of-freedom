# Migration to Multi-Service Architecture (MusicGen, Orchestrator, Jen1, DiffSinger)

This guide describes the rationale, high-level design, and recommended steps to migrate from the old `harmonia-worker`
monolithic Docker image towards a multi-service architecture with the following key components:

- orchestrator — A lightweight HTTP gateway that accepts job requests, enqueues workers, and returns job status.
- musicgen — Synchronous HTTP container that runs MusicGen inference; provide CPU or GPU builds depending on deployment.
- jen1 — Background Redis-backed worker for asynchronous jobs (generative tasks or render tasks).
- diffsinger (optional) — Service or worker for singing synthesis jobs.
- ollama (optional) — A separate runtime for LLM-based orchestration or prompt-based helper tasks. Run as a wrapper
  container and forward requests to a local Ollama daemon or remote service.

Why migrate?

- Monolithic heavy images cause dependency collisions (Tokenizers, Transformers vs Torch) and make CI builds slow and
  brittle.
- Per-service isolation allows different Python envs, different runtime libraries, and smaller CI images.
- Enables autoscaling via KEDA for worker queues and simpler lifecycle management.

High-level strategy:

1. Use `containers/` to develop small, tested service images for MusicGen, Jen1, and Orchestrator.
2. Use `clean_services/docker-compose.clean.yml` for local dev and CI smoke tests.
3. Keep legacy artifacts (e.g., `Dockerfile.worker`) in tree as an archival copy; prefer `containers/` for day-to-day
   development.
4. Add GPU-specific builds and CI steps for those builds as a separate pipeline (to avoid requiring GPU runners in main
   CI).

Dev notes:

- Use `fakeredis` for unit tests to avoid spinning up Redis during unit tests.
- Use `httpx` or `requests` in sample scripts to call the orchestrator and musicgen APIs.
- Keep placeholder inference during initial dev; update with heavy model installs in staged builds.

Examples:

- Enqueue an async job via orchestrator:

  ```bash
  curl -X POST http://localhost:8000/job -H "Content-Type: application/json" -d '{"model":"jen1","mode":"async","payload":{"instructions":"render violin"}}'
  ```

- Call the MusicGen sync endpoint:

  ```bash
  curl -X POST http://localhost:8001/generate -H "Content-Type: application/json" -d '{"text":"solo piano melody"}'
  ```

Migration checklist:

- \[ ] Update all scripts calling `docker exec harmonia-worker` to use the orchestrator or per-service docker commands.
- \[ ] Replace developer documentation references that expect a single monolithic Dockerfile with references to
  `containers/` & `clean_services/`.
- \[ ] Deprecate or archive `Dockerfile.worker` and add migration notes to `RELEASE_NOTES.md`.
- \[ ] Add K8s manifests for orchestrator, musicgen, router and ensure proper secrets and PVCs are created.
- \[ ] Update CI to test per-service containers and, optionally, separate GPU-based CI jobs for heavy models.

For detailed steps and examples, consult the `containers/*` READMEs and `clean_services` README.
