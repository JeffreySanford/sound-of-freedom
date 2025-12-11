# Ollama LLM Service (Local / On-Prem)

Overview

- This container is intended for hosting large local LLMs supported by Ollama or other local LLM servers that provide a local binary.
- It is best suited for GPU-enabled hosts for intensive inference workloads.

Preferred OS and runtime

- Docker base: `ubuntu:22.04` or `ubuntu:24.04` for CUDA, PyTorch and system compatibility.
- GPU setups should rely on NVIDIA container runtime (`nvidia-container-toolkit`), using `--gpus all` at runtime.

Models & distribution

- Ollama provides integrations to run various LLMs. If using a particular LLM, consult the model provider and licensing.

Common large LLMs and distributions to consider:

- LLama 2 / 3 (Meta) via compatible open-source runtimes and vendors
- Mistral, Llama-alikes, and other open weights hosted on Hugging Face
- Hugging Face Hub: <https://huggingface.co>

Operational notes

- Address resource management: LLMs can require 50+ GB of GPU memory for very large models. Prefer cloud or on-prem GPU nodes with suitable vRAM.
- Network access: serve models on internal network ports (`11434` default in this template).
- Privacy & safety: pay attention to model licensing and data privacy.

Usage

- This folder contains a placeholder `entrypoint.sh` and `Dockerfile`. Replace these placeholders with
  your organization's instructions for installing and launching your chosen LLM binary/service.
- To run a real Ollama binary inside the container, place the Ollama binary at `/opt/ollama/bin/ollama`
  inside the image or mount it at runtime. The entrypoint will attempt to run
  `/opt/ollama/bin/ollama serve --port 11434` if it finds the binary.

Example (bind-mount a local binary into the container):

```bash
docker run --rm -it --name ollama -v "$(pwd)/ollama-bin:/opt/ollama/bin" -p 11434:11434 ollama:dev
```

Optional automatic model pulls

- The `entrypoint.sh` supports an optional automatic model pull step. To enable it, set `OLLAMA_AUTO_PULL=1`
  and provide a comma-separated list of models in `OLLAMA_PULL_MODELS` (for example,
  `mistral3:6.5b,deepseek-coder:6.7b,mistral:7b`).
- If a requested model is already present (under the default Ollama models path), the entrypoint will skip
  pulling it. If not present and `OLLAMA_AUTO_PULL` is set, the entrypoint attempts `ollama pull <model>` on
  startup and logs warnings on failure.

Example enabling auto-pull when running the container (use with caution on limited disk/network):

```bash
docker run --rm -e OLLAMA_AUTO_PULL=1 -e OLLAMA_PULL_MODELS="minstral3,deepseek-coder:6.7b,mistral:7b" \
  -v "$(pwd)/ollama-bin:/opt/ollama/bin" -p 11434:11434 ollama:dev
```

Security & scale

- Use role-based access and an internal firewall or VPC to limit access to the model server endpoint.
- Use a load-balancer in front of workers if you horizontally scale multiple Ollama instances.

Notes

- This setup intentionally contains a placeholder entrypoint because distributing or packaging particular LLM binaries can be subject to licensing restrictions.
  Follow your organization's compliance and licensing policy when packaging or distributing models.

See also

- Ollama docs: <https://ollama.ai/> (check product docs for installation options — not a binary distribution in this repo)
- Hugging Face model hub for models and licenses: <https://huggingface.co>

***End of README for Ollama***
