# jen1 — Generation microservice

Overview

- `jen1` is a microservice for lyric/metadata generation or for a secondary music-generation step depending on your pipeline.
- Designed to run as an isolated service in the `sound-creator` monorepo and communicate via HTTP or message bus.

Preferred OS and runtime

- Docker: base image should be `ubuntu:22.04` or `ubuntu:24.04` for compatibility with common GPU drivers and tooling.
- For GPU-accelerated model execution, use NVIDIA images with CUDA and install the appropriate drivers on the host.

Recommended stack & runtime

- Node.js (16+ LTS or 20.x) for wrapper service (API handlers) combined with a model runtime (PyTorch or ONNX) for ML inference.
- If deploying a Python-based model directly, prefer `python:3.10-slim` or `python:3.11-slim` (Ubuntu-based) image and install GPU dependencies as needed.

Where to find models & datasets

- Model (typical): Repositories like OpenAI's Jukebox (not maintained) or other in-house models can be used. Popular sources:

  - Hugging Face model hub: <https://huggingface.co> — search for music generation models; e.g. `facebook/musicgen-small` or other prepackaged music models.
  - For in-house trained models, store model weights in a secure object storage (S3, GCS) and fetch during Docker build or at runtime.

Datasets commonly used for training (public)

- MAESTRO (MIDI + aligned audio): <https://magenta.tensorflow.org/datasets/maestro>
- Free Music Archive (FMA): <https://github.com/mdeff/fma>
- NSynth (Google): <https://magenta.tensorflow.org/datasets/nsynth>
- GTZAN, AudioSet, and other curated corpora

Notes & operational considerations

- GPU/accelerator access: For training/inference, use `nvidia/cuda` variants or `nvidia-container-toolkit` with Docker host installed. Prefer cloud GPUs for heavy inference.
- Storage: Use shared blob storage for model weights and generated assets; avoid storing large files in container images.
- Security: Use secrets for model access keys and limit model downloads to authorized accounts.

Development & testing

- Local dev (no GPU): Use CPU-based test fixtures and smaller models.
- Data / model fetching: Use runtime fetching for model artifacts in the container's `entrypoint` to reduce image size and ease updates.
  - For example, download and cache model weights in `/var/lib/jen1/models` or similar.

Dockerfile hints

- Use a slim Ubuntu base (e.g., `ubuntu:22.04`) or `python:3.11-slim` if model runtime uses Python.
- Keep heavy packages (CUDA, PyTorch) installed only in GPU specialized builds or use `multi-stage` builds with artifacts copied in.

Using jen1 with the orchestration system

- `jen1` exposes HTTP endpoints such as `/health` and a generation API `POST /generate` that the `orchestrator` service can call.
- Use Redis as a job queue or state store for async processing (orchestrator + worker pattern).

See also

- Audio model resources, Hugging Face: <https://huggingface.co/models?pipeline_tag=audio-generation>
- Audio generation research: <https://github.com/facebookresearch/audiocraft>
