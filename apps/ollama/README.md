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

- This folder contains a placeholder `entrypoint.sh` and Dockerfile. You should replace the placeholder with instructions for installing and launching your chosen LLM binary/service.

Security & scale

- Use role-based access and an internal firewall or VPC to limit access to the model server endpoint.
- Use a load-balancer in front of workers if you horizontally scale multiple Ollama instances.

Notes

- This setup intentionally contains a placeholder entrypoint because distributing or packaging particular LLM binaries may be subject to licensing restrictions. Follow your organization's compliance and licensing policy when packaging the model.

See also

- Ollama docs: <https://ollama.ai/> (check product docs for installation options — not a binary distribution in this repo)
- Hugging Face model hub for models and licenses: <https://huggingface.co>

***End of README for Ollama***
