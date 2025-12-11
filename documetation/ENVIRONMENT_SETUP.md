# Local environment startup (start:env)

This document explains how to start the local development environment with a single `pnpm` command.

## Overview

- Infra is started inside Docker Compose (jen1, muscgen, redis, ollama and orchestrator).
- Developer-local services (frontend and api) are started locally with NX by default (so you get HMR and local debugging).
- The orchestrator waits for the infra and also will wait for front/backend to come online either as host services or as containers.

## How to start

Start the environment (infra and local frontend/api):

```bash
pnpm start:env
```

- This runs a script that:

- Builds and starts the infra containers (jen1, muscgen, redis, ollama, orchestrator).
- Determines whether frontend and api are provided by the compose file or not; if not present, it uses NX to spawn the local `frontend` and `api` dev servers.

### Forcing local serve or skipping it

Force local serve of one or both projects:

```bash
pnpm start:env --force-local=frontend,api
# or set from environment
FORCE_LOCAL_SERVE=frontend,api pnpm start:env
```

Skip local serve entirely:

```bash
pnpm start:env --skip-local
```

Explicitly include particular services to start locally (overrides detection):

```bash
node tools/scripts/start-all-docker.js --include=frontend
# or via npm script
pnpm start:env -- --include=frontend
```

### Debug mode and compose file override

You can enable API request/response debug logs by passing `--debug`. This sets
`API_DEBUG_COMMANDS=1` for both local `nx` serves and the docker compose runs:

```bash
node tools/scripts/start-all-docker.js --include=frontend,api --debug
```

If you want to override the compose file the script uses, pass `--compose-file`:

```bash
node tools/scripts/start-all-docker.js \
  --compose-file=docker-compose.dev.yml \
  --debug
```

When using `--debug` the script creates a temporary `.env.debug` file and passes
it to `docker compose` so your container can read `API_DEBUG_COMMANDS` from the
compose-defined env fields.

To force the API startup to require Ollama and fail if unavailable, pass `--require-ollama` to the script or define `REQUIRE_OLLAMA=1` in your environment. Example:

```bash
node tools/scripts/start-all-docker.js --require-ollama
```

### Requiring Ollama

If you want to fail the API startup when Ollama is not available, set `REQUIRE_OLLAMA=1` in your `.env`/compose envs.
This is useful in production where the Ollama dependency is mandatory:

```bash
REQUIRE_OLLAMA=1 node tools/scripts/start-all-docker.js --compose-file=docker-compose.yml --debug
```

If `REQUIRE_OLLAMA` is not set, the API will start and fall back to sample metadata whenever Ollama is unavailable.

> Note: `--` is used to forward flags to the underlying node script when invoked through `pnpm`.

## Health checks

## Troubleshooting and tips

- If `pnpm` isn't installed globally, the script will fall back to `npm exec -- pnpm`.
- If a host process already binds to ports used by Docker (4200, 3000, 4000, 4001, 4002, 6379, 11434, ...), the script will warn and abort.
- To check logs from the infra containers:

```bash
pnpm start:all:docker:logs
```

- To stop all infra containers that were started:

```bash
pnpm start:all:docker:down
```

## Example: Start all with local dev servers

```bash
pnpm start:env
# expected output:
# - docker compose starts up jen1, muscgen, redis, ollama, orchestrator
# - the script then spawns NX to serve frontend and api locally (if they were not provided in docker)
```

## Run the full stack in Docker (no local HMR)

If you prefer to run the frontend and api inside containers rather than locally, use the convenience script:

```bash
pnpm start:env:docker
```

***

If you'd like, I can add a `start:env:docker` script which runs the frontend and API via Docker as well (no HMR).

I can also add more precise orchestrator healthchecks for better readiness gates.
