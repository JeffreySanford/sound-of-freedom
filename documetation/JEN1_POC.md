# JEN1 PoC: Running the end-to-end generation flow (API -> Orchestrator -> Jen1)

This document describes a minimal PoC to validate that the `jen1` microservice is callable through the orchestration stack and the API.

Prerequisites

- Node.js and pnpm
- Docker (optional, if you want to run services in containers)
- The following services should be available during PoC: API, Orchestrator, Jen1 (can be run locally via `pnpm start:<app>` or via Docker)

Steps

1. Start jen1 and orchestrator locally (or via Docker):

   ```bash
   pnpm nx serve jen1
   ```

   In a new terminal, start orchestrator (ensure `JEN1_URL` set to `http://localhost:4001` if running locally)

   ```bash
   pnpm nx serve orchestrator
   ```

   Start the orchestrator worker (separate process) in a new terminal to consume jobs:

   ```bash
   pnpm --filter orchestrator run start:worker
   ```

   Start the API (if not already running)

   ```bash
   pnpm nx serve api
   ```

2. Run the PoC script from root to invoke the API /songs/generate-song with `model: 'jen1'`:

   ```bash
   pnpm poc:jen1
   ```

   This script now queries the local Ollama server to generate a structured song JSON, then submits a background job to the API with the generated song in `options.generatedSong`.

3. Test Ollama directly for song/metadata:

   ```bash
   node scripts/ollama/test-ollama-lyrics.js deepseek song "A story about moonlight and neon streets"
   node scripts/ollama/test-ollama-lyrics.js deepseek metadata "A story about moonlight and neon streets"
   ```

4. Expected result

- The script will POST to the API, which will detect `model: 'jen1'` and call the orchestrator's `/compose` endpoint.
- The orchestrator forwards the payload to `jen1` `/generate` and returns the generated JSON.
- If you run `jen1` with CUDA (`USE_TORCH=1` and `MODEL_NAME` set), and a GPU is available, the service will attempt to load the model into CUDA and use it to
generate lyrics where applicable. You can verify using `GET /debug/torch` and `GET /debug/model`.
- You should see a JSON response with the generated song (title, lyrics, sections).

Notes & Behind the scenes

- This PoC uses a deterministic, Node-based `jen1` generator (PoC only). Replace the `/generate` handler in `jen1` with a real model runtime for production.
- To run the stack in Docker Compose, update or set up `docker-compose.yml` or `docker-compose.dev.yml` and set the appropriate environment variables.

Next steps

- Add the real model runtime to `jen1` or use a Python-based model runtime container.
- Implement job queuing in orchestrator with Redis for async generation.
- Add progress notifications to the API via WebSockets for long-running generation jobs.
