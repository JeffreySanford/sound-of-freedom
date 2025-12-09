# Docker Compose helper scripts

Small helper scripts to simplify local development with Docker Compose for the sound-creator stack.

## Scripts

- `compose-up.sh` — Start the stack.
- `compose-down.sh` — Stop the stack via `docker compose down`.
- `compose-cleanup.sh` — Remove local containers and images created by the stack (use with caution).

Options:

- Use `OLLAMA_HOST_MAPPING` to override host mapping, e.g. `export OLLAMA_HOST_MAPPING=11434:11434`.
- Set `OLLAMA_RANDOMIZE=1` to let Docker choose an ephemeral host port for Ollama.

## Usage

```bash
export OLLAMA_HOST_MAPPING=11434:11434
./scripts/docker/compose-up.sh
```

```bash
./scripts/docker/compose-down.sh
```

```bash
./scripts/docker/compose-cleanup.sh
```

## Notes

- `compose-up.sh` runs `compose-cleanup.sh` by default; set `SKIP_CLEANUP=1` to skip.
- If a non-docker process binds the chosen host port, `compose-up.sh` will abort and print process info so you can free the port.
