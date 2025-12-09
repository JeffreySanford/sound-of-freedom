# muscgen — Music Generation Microservice

Overview

- `muscgen` is the music generation microservice, wrapping model inference (e.g. Meta's MusicGen) and exposing audio generation endpoints.

Preferred OS and runtime

- Docker base: `ubuntu:22.04` or `ubuntu:24.04` — Ubuntu is preferred for stable NVIDIA driver compatibility and PyTorch/CUDA setups.
- GPU recommended for inference: use NVIDIA CUDA drivers and `nvidia-container-toolkit` with the `--gpus` option.

Model & repository

- MusicGen (by Meta/Facebook) — code & sample models: <https://github.com/facebookresearch/audiocraft>
- Hugging Face models — example tags: `facebook/musicgen-small`, `facebook/musicgen-medium`, `facebook/musicgen-large` (check licensing and model cards for each version)

Datasets

- MAESTRO: piano + aligned audio dataset: <https://magenta.tensorflow.org/datasets/maestro>
- Free Music Archive (FMA): <https://github.com/mdeff/fma>
- NSynth (Google): <https://magenta.tensorflow.org/datasets/nsynth>
- AudioSet & curated music corpora — augment with consent/legally cleared data

Operational considerations

- Use runtime model downloading (from storage or Hugging Face) instead of baking large weights into the image.
- Expose an HTTP JSON API: `POST /generate` to submit generation requests and `GET /jobs/:id` for asynchronous status.
- Use Redis for job queueing and caching generated artifacts (or orchestrator handles job queuing).

Dockerfile hints

- Base on `ubuntu:22.04` and install Python & PyTorch; use a GPU image as needed (CUDA libs).
- Multi-stage builds: install build dependencies only in the builder stage; keep runtime image slim.
- Avoid copying large model files into the image; fetch at startup.

Security & licensing

- Many public music models are research artifacts — check license (e.g., Meta + Hugging Face model license) before using in production.
- For voice cloning or other sensitive use cases, make sure you have appropriate consent and watermarking strategies.

See also

- Facebook Research Audiocraft: <https://github.com/facebookresearch/audiocraft>
- Hugging Face MusicGen models: <https://huggingface.co/models?search=musicgen>
