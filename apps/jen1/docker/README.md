# jen1 Docker Notes

- The Dockerfile at `apps/jen1/Dockerfile` builds the production image for `jen1`.
- Preferred runtime: `ubuntu:22.04` or `node:20-bookworm-slim` depending on whether Python ML modules are used.
- For GPU-based inference, consider switching the image to an NVIDIA CUDA base and installing GPU deps.
- Avoid bundling large model files inside the image; download runtime artifacts from secure storage or use a mounted volume.
