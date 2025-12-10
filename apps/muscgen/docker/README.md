# muscgen Docker Notes

- The Dockerfile at `apps/muscgen/Dockerfile` builds the production image for `muscgen` (Python-based server by default).
- Preferred runtime: `ubuntu:22.04` or `python:3.11-slim-bookworm`.
- For GPU-based inference, build from `nvidia/cuda` runtime images and install PyTorch with appropriate CUDA support.
- Avoid bundling large model files inside the image; download runtime artifacts from secure storage or use a mounted volume.
