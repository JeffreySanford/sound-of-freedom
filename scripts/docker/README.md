# Docker Compose helper scripts

Start/stop and cleanup helper scripts for local development with Docker Compose.

# Docker Compose helper scripts

Helper scripts for starting, stopping, and cleaning up the sound-creator Docker compose stack.

Scripts

- `compose-up.sh` — start the stack. It expects `OLLAMA_HOST_MAPPING` in `host:container` form.
- `compose-down.sh` — stop the stack with `docker compose down`.
- `compose-cleanup.sh` — stop/remove local sound-creator containers and images.

Usage

```bash
# Set explicit mapping: host 11434 -> container 11434
export OLLAMA_HOST_MAPPING=11434:11434
./scripts/docker/compose-up.sh

# Stop the stack
./scripts/docker/compose-down.sh

# Cleanup containers/images from previous runs
./scripts/docker/compose-cleanup.sh
```

Notes

- `compose-up.sh` executes `compose-cleanup.sh` by default to avoid port conflicts. Set `SKIP_CLEANUP=1` to skip
  cleanup.
- If a non-docker process binds the desired host port, `compose-up.sh` will abort and print the process info.

# Docker compose helper scripts

Start/stop helper scripts for the sound-creator docker compose stack.

Files:

- `compose-up.sh` — Starts the stack; uses `OLLAMA_HOST_MAPPING` to map host:container ports (must be host:container
  form, e.g. `11434:11434`). Randomization is not supported.
- `compose-cleanup.sh` — Stops and removes sound-creator containers and images built locally.
- `compose-down.sh` — Stops and removes the stack using `docker compose down`.

Usage:

```bash
# Start with explicit mapping
export OLLAMA_HOST_MAPPING=11434:11434
./compose-up.sh

# Stop the stack
./compose-down.sh

# Cleanup any containers/images from prior runs
./compose-cleanup.sh
```

Notes:

- The `compose-up.sh` script performs a cleanup run by default (set `SKIP_CLEANUP=1` to skip).
- If a non-docker process already binds the chosen host port, the script will abort so you can free that port.

# Docker compose helper scripts

Scripts to start and stop the media-creator Docker compose stack, with safe handling for Ollama host port mapping.

## Files

- `compose-up.sh` — starts the stack; optionally maps Ollama host port using `OLLAMA_HOST_MAPPING`, or randomizes the
  host port with `OLLAMA_RANDOMIZE=1`.
- `compose-down.sh` — stops and removes the stack.

## Examples

```bash
# map host port 11434 -> container 11434
export OLLAMA_HOST_MAPPING=11434:11434
./compose-up.sh

# randomized host port for Ollama (no static host binding)
OLLAMA_RANDOMIZE=1 ./compose-up.sh

# stop
./compose-down.sh
```

Notes

- If a docker container is using the chosen host port, `compose-up.sh` will stop and remove it before starting the
  stack.
- If a non-docker host process binds the chosen host port, the script will abort and ask you to free the port manually.

# Docker compose helper scripts for the media-creator stack

Two convenience scripts are included to help manage host port conflicts for Ollama and to start/stop the stack.

## Scripts

- `compose-up.sh` — Starts the docker compose stack and ensures a chosen host port is free before mapping Ollama.

  - Supports `OLLAMA_HOST_MAPPING` to override the host-to-container mapping for Ollama. Examples:
    - `export OLLAMA_HOST_MAPPING=11435:11434` maps host port 11435 -> container port 11434.
    - `export OLLAMA_HOST_MAPPING=11434` (shorthand) maps container port only and lets Docker pick a host port.
  - Set `OLLAMA_RANDOMIZE=1` for randomized mapping (no static host port).
  - The script stops any existing docker container that is using the host port. If a non-docker process binds the host
    port, the script prints a warning and exits.

- `compose-down.sh` — Stops and removes compose services started by the stack.

## Usage examples

```bash
# start with a static host mapping
export OLLAMA_HOST_MAPPING=11434:11434
./compose-up.sh

# start with a randomized host mapping (Docker chooses the host port)
OLLAMA_RANDOMIZE=1 ./compose-up.sh

# stop the stack
./compose-down.sh
```

## Notes

- To map the host port to a custom value, set `OLLAMA_HOST_MAPPING` to `<host-port>:11434`.
- If a host-native process binds the chosen host port, stop it manually before starting the stack (the script will
  abort).

# Docker compose helper scripts for the media-creator stack

Two convenience scripts were added to help manage port conflicts for Ollama and to start/stop the stack.

## Scripts

- `compose-up.sh` — Starts the docker compose stack and ensures a chosen host port is free before mapping Ollama.

  - Supports `OLLAMA_HOST_MAPPING` to override the host-to-container mapping for Ollama. Examples:
    - `export OLLAMA_HOST_MAPPING=11435:11434` maps host port 11435 -> container port 11434.
    - `export OLLAMA_HOST_MAPPING=11434` (shorthand) maps container port only and lets Docker pick a host port.
  - Set `OLLAMA_RANDOMIZE=1` for randomized mapping (no static host port).
  - The script stops any existing docker container using the host port. If a non-docker process binds the host port, the
    script prints a warning and exits.

- `compose-down.sh` — Stops and removes compose services started by the stack.

## Usage examples

```bash
# start with a static host mapping
export OLLAMA_HOST_MAPPING=11434:11434
./compose-up.sh

# start with a randomized host port (no static host binding — Docker will pick)
OLLAMA_RANDOMIZE=1 ./compose-up.sh

# stop the stack
./compose-down.sh
```

## Notes

- To map the host port to a custom value, set `OLLAMA_HOST_MAPPING` to `<host-port>:11434`.
- If a host-native process binds the chosen host port, stop it manually before starting the stack (the script will
  abort).

# Docker compose helper scripts for the media-creator stack

Two convenience scripts were added to help manage port conflicts for Ollama and to start/stop the stack.

## Scripts

- `compose-up.sh` — Starts the docker compose stack and ensures a chosen host port is free before mapping Ollama.

  - Supports `OLLAMA_HOST_MAPPING` to override the host-to-container mapping for Ollama. Examples:
    - `export OLLAMA_HOST_MAPPING=11435:11434` maps host port 11435 -> container port 11434.
    - `export OLLAMA_HOST_MAPPING=11434` (shorthand) maps container port only and lets Docker pick a host port.
  - Set `OLLAMA_RANDOMIZE=1` for randomized mapping (no static host port).
  - The script stops any existing _docker_ container using the host port. If a non-docker process binds the host port,
    the script prints a warning and exits.

- `compose-down.sh` — Stops and removes compose services started by the stack.

## Usage examples

```bash
# start with a static host mapping
export OLLAMA_HOST_MAPPING=11434:11434
./compose-up.sh

# start with a randomized host port (no static host binding — Docker will pick)
OLLAMA_RANDOMIZE=1 ./compose-up.sh

# stop the stack
./compose-down.sh
```

## Notes

- To map the host port to a custom value, set `OLLAMA_HOST_MAPPING` to `<host-port>:11434`.
- If a host-native process binds the chosen host port, stop it manually before starting the stack (the script will
  abort). Docker compose helper scripts for the media-creator stack

Two convenience scripts were added to help manage port conflicts for Ollama and to start/stop the stack:

- `compose-up.sh`: Starts the docker compose stack and ensures a chosen host port is free before mapping Ollama.
  - Supports an environment variable `OLLAMA_HOST_MAPPING` that lets you override the host:container port mapping for
    Ollama.
    - Example: `export OLLAMA_HOST_MAPPING=11435:11434` maps host 11435 -> container 11434.
    - Example: `export OLLAMA_HOST_MAPPING=11434` (shorthand) maps container port only and lets Docker pick a host port.
  - Set `OLLAMA_RANDOMIZE=1` for randomized mapping (no static host port). Equivalent to `OLLAMA_HOST_MAPPING=11434`.
  - The script will stop an existing container that is using the chosen host port (if a docker container is using it)
    and will refuse to start if a non-docker process is bound to the port.
- `compose-down.sh`: Stops and removes the compose stack.

Usage examples

```
# Start with a static host mapping
export OLLAMA_HOST_MAPPING=11434:11434
./compose-up.sh

# Start with a randomized host port for ullama (no static host binding)
OLLAMA_RANDOMIZE=1 ./compose-up.sh

# Stop
./compose-down.sh
```

Notes

- If you need to map the host port to a custom port on the host, set `OLLAMA_HOST_MAPPING` to `<host-port>:11434`.
- If a non-docker process binds a host port (e.g., a native service on the machine), the script will abort and print the
  process info so you can stop it manually.
