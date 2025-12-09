# Ollama Docker Notes

- The Dockerfile at `apps/ollama/Dockerfile` is a template for running an on-prem LLM worker.
- Preferred runtime: `ubuntu:22.04` for driver and CUDA compatibility.
- Large LLM models require high GPU vRAM; consider inference optimizations (quantization, CPU offload, or model sharding) in production.
- Avoid shipping model binaries in images; use shared storage and download at start-time or mount storage volumes.
