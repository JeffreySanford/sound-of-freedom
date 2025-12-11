# Ollama Docker Notes

- The Dockerfile at `apps/ollama/Dockerfile` is a template for running an on-prem LLM worker.
- Preferred runtime: `ubuntu:22.04` for driver and CUDA compatibility.
- Large LLM models require high GPU vRAM; consider inference optimizations (quantization, CPU offload, or model sharding) in production.
- Avoid shipping model binaries in images; use shared storage and download at start-time or mount storage volumes.

Optional auto-pull behavior

- The `entrypoint.sh` supports an optional automatic model pull on startup.
  To enable it, set `OLLAMA_AUTO_PULL=1` and provide a comma-separated list of models
  in `OLLAMA_PULL_MODELS` or use `OLLAMA_AVAILABLE_MODELS` as defaults.
  Example:

```bash
# Pull models at container startup (if binary present and auto pull enabled)
docker run --rm -e OLLAMA_AUTO_PULL=1 \
  -e OLLAMA_PULL_MODELS="minstral3,deepseek-coder:6.7b,mistral:7b" \
  -v "$(pwd)/ollama-bin:/opt/ollama/bin" \
  -p 11434:11434 ollama:dev
```
