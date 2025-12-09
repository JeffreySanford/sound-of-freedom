# JEN1 Overview

This document provides an overview and operational guidance for `jen1`, the internal microservice used to generate metadata, lyrics, or auxiliary music components.

Summary

* `jen1` is a Node/Python microservice that can host lightweight models or act as a wrapper for LLM inference that prepares prompts/metadata for MusicGen.

Preferred OS & runtime

* Recommended base OS: Ubuntu 22.04 LTS in Docker images for consistent Python/CUDA driver compatibility.
* When `jen1` uses Python ML libraries, prefer `python:3.11-slim` or `python:3.10-slim` as a Docker base and add GPU drivers where needed.

Model & dataset hints

* For lyrics & metadata: small LLMs or dedicated style models can be used from the Hugging Face model hub (vary by license).
* For music components: rely on MusicGen or other symbolic models — see MusicGen overview.

Integration

* `jen1` exposes API endpoints for generation and health checks; orchestrator may use Redis for queuing.
* Example endpoints: `POST /generate-metadata`, `GET /health`.

Security & operations

* Use secrets for any model keys, keep runtime credentials out of images.
* For high availability use scaling and a Redis/queue-based worker model.

See also

* MusicGen Overview: `documetation/MUSICGEN_OVERVIEW.md`
* Datasets and model guidelines in `documetation/MUSIC_GENERATION_FEATURES_OVERVIEW.md`

\*\*\* End JEN1 Overview
