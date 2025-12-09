# Model services: MusicGen, Jen‑1, DiffSinger

This document describes the model services architecture used in Harmonia for audio generation: MusicGen (instrumental & vocals), Jen‑1 (full-song, GPU heavy), and DiffSinger (vocal clone / synthesis).

Overview

- Separate containers per model to isolate dependency conflicts (Transformers, Tokenizers, PyTorch, etc.).
- Router service acts as an API gateway to forward requests to registered model services (sync vs async) and enqueues GPU-bound jobs.
- Redis acts as the lightweight queue for async jobs and job status storage.
- Jen‑1 is a GPU-only worker and should run on nodes that have GPUs through Docker's runtime or in Kubernetes with device requests.
- MusicGen can run CPU-only for dev and optional GPU for production.

Local development

- Use `docker-compose.dev.yml` to start `redis`, `router`, `musicgen`, `diffsinger` and `jen1` services.
- `jen1` in compose is configured with `runtime: nvidia` and `INSTALL_TORCH=gpu` build arg; make sure your Docker Host can run GPUs.

Notes on dependency management

- Pin transformers/tokenizers/torch versions per-service to avoid API mismatch.
- Prefer Python 3.10 images to maximize pre-compiled wheels available and avoid Rust-based builds for tokenizers.

Scaling

- In production, deploy `jen1` as a scaled set of replicas with KEDA (redis scaledobject) so that the number of replicas scales with queue length and device availability.
- MusicGen and DiffSinger can scale independently depending on load and hardware availability.

Current skeletons

- `services/musicgen` — FastAPI server (placeholder implementation available) and Dockerfile.
- `services/jen1` — Redis worker skeleton configured for GPU and Dockerfile for optional GPU build-wheels.
- `services/diffsinger` — FastAPI server + Redis worker skeleton. Placeholder generation is implemented to enable local testing without heavy models.

Example: Requesting a vocal synth

- To generate a vocal clip synchronously: POST /generate to the router with {"model":"diffsinger","mode":"sync","text":"Hello"}
- For an async job: POST /generate with {"model":"diffsinger","mode":"async","text":"..."} and poll /status/{job_id}

Model load/weights

- DiffSinger and Jen-1 can be loaded from a local checkpoint on container startup by setting `DIFFSINGER_MODEL_PATH` or `JEN1_MODEL_PATH` environment variable in the container; if not set, the service will fall back to placeholder outputs for local dev and smoke tests.

To enable production models in containers:

- Place model artifacts in a `models` folder and mount it into the container via volumes (dev) or PVC (K8s) under `/workspace/models` or a path of your choosing.
- Set the `DIFFSINGER_MODEL_PATH` or `JEN1_MODEL_PATH` env var on the container to the checkpoint file or directory to load.
  Example using `docker-compose.dev.yml`:

  ```bash
  DIFFSINGER_MODEL_PATH=/workspace/models/diffsinger/checkpoint docker compose -f docker-compose.dev.yml up --build
  ```

  or add env var to the compose service block:

  ```yaml
  services:
    diffsinger:
      environment:
        - DIFFSINGER_MODEL_PATH=/workspace/models/diffsinger/checkpoint
  ```
