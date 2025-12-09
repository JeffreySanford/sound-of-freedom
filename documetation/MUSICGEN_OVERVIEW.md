# MusicGen Overview

This document summarizes best practices, OS choices, model & dataset sources, and deployment guidance for MusicGen-based inference in the `sound-creator` platform.

Summary

- MusicGen is a state-of-the-art music generation model (research code in `audiocraft`), capable of producing audio given prompts and conditioning. Learn more: <https://github.com/facebookresearch/audiocraft>

# MusicGen Overview

This document summarizes best practices, OS choices, model & dataset sources, and deployment guidance for
MusicGen-based inference in the `sound-creator` platform.

Summary

- MusicGen is a music generation model (research code in `audiocraft`) capable of producing audio given prompts
  and conditioning. Learn more: <https://github.com/facebookresearch/audiocraft>

Preferred OS & runtime

- Recommended base OS: Ubuntu 22.04 LTS for driver and CUDA compatibility.

- GPU: NVIDIA with appropriate CUDA toolkit and drivers (CUDA 11.8 or 12.x depending on the PyTorch version).
  Use the NVIDIA container runtime and images like `nvidia/cuda:12.1-runtime-ubuntu22.04` when GPU acceleration
  is required.

- Python: 3.10 or 3.11 recommended (use `python:3.11-slim-bullseye` as a base in Docker if a Python build is
  necessary).

Model / artifacts

- Official repo: <https://github.com/facebookresearch/audiocraft>

- Hugging Face: search for `musicgen` — examples include `facebook/musicgen-small`, `facebook/musicgen-medium`,
  and `facebook/musicgen-large`.

- Use official model cards to determine inference costs and licensing.

Datasets & resources

- MAESTRO dataset (MIDI + audio): <https://magenta.tensorflow.org/datasets/maestro>

- Free Music Archive (FMA) dataset: <https://github.com/mdeff/fma>

- NSynth (Google Magenta): <https://magenta.tensorflow.org/datasets/nsynth>

Deployment recommendations

- Do not bake model weights into a Docker image during build; instead, fetch models at runtime or mount a
  shared model volume.

- Use multi-stage Docker builds to minimize the final image size.

- Limit resource consumption: use job queues (Redis) and orchestrator-managed concurrency to avoid memory
  oversubscription.

Licensing & ethics

- Review model license on Hugging Face and in the `audiocraft` repository before deployment.

- For large models, confirm whether the model weights are allowed to be redistributed. If the license
  disallows redistribution, download the model at runtime from the host or a permitted storage location.

Security & operations

- Secure model endpoints with authentication and rate-limiting.

- Audit and log generation requests; store generated artifacts in permissioned S3 buckets.

\*\*\* End of MusicGen Overview
