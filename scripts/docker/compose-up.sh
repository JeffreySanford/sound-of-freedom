#!/usr/bin/env bash
set -euo pipefail

# Simple docker compose launcher with Ollama port safety checks
# Usage:
#   OLLAMA_HOST_MAPPING=11435:11434 ./scripts/docker/compose-up.sh   # map host 11435 -> container 11434
#   (No randomization is supported or allowed) — a strict host:container mapping is enforced.

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
MAPPING=${OLLAMA_HOST_MAPPING:-11434:11434}

# Enforce host:container mapping form; do not allow randomization or shorthand values.
if [[ "${MAPPING}" != *":"* ]]; then
  echo "OLLAMA_HOST_MAPPING must be in host:container format (e.g. 11434:11434). Using default mapping 11434:11434."
  MAPPING="11434:11434"
fi

echo "Using compose file: ${COMPOSE_FILE}"
echo "OLLAMA mapping: ${MAPPING}"

host_port=""
if [[ "${MAPPING}" == *":"* ]]; then
  host_port="${MAPPING%%:*}"
fi

if [ -n "${host_port}" ]; then
  echo "Checking for existing containers holding host port ${host_port}..."
  # Detect containers that have the host port mapped
  container_id=$(docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' | grep -E "0.0.0.0:${host_port}->|\[::]:${host_port}->" | awk '{print $1}' | head -n 1 || true)
  if [ -n "${container_id}" ]; then
    echo "Found container ${container_id} using host port ${host_port}. Stopping and removing..."
    docker stop "${container_id}" || true
    docker rm "${container_id}" || true
  else
    echo "No docker container using host port ${host_port} found. Checking for other processes..."
    # Try to detect non-docker processes holding the port. Use ss or lsof if available.
    if command -v ss >/dev/null 2>&1; then
      ss -ltnp | grep -E ":[[:space:]]*${host_port}\\b" || true
      if ss -ltnp | grep -qE ":[[:space:]]*${host_port}\\b"; then
        echo "Warning: A host process is listening on port ${host_port}. Please stop or free it before running this script." >&2
        ss -ltnp | grep -E ":${host_port}\\b" || true
        exit 1
      fi
    elif command -v lsof >/dev/null 2>&1; then
      if lsof -i TCP:${host_port} -sTCP:LISTEN; then
        echo "Warning: A host process is listening on port ${host_port}. Please stop or free it before running this script." >&2
        exit 1
      fi
    else
      echo "Warning: Couldn't reliably detect non-docker host processes; proceeding if ports appear free for docker." >&2
    fi
  fi
fi

# Optionally cleanup containers/images before starting. To skip set SKIP_CLEANUP=1
if [ "${SKIP_CLEANUP:-0}" != "1" ]; then
  echo "Running cleanup script to ensure no port conflicts (set SKIP_CLEANUP=1 to disable)"
  bash "$(dirname "$0")/compose-cleanup.sh"
fi

echo "Starting docker-compose with OLLAMA_HOST_MAPPING='${MAPPING}'..."
OLLAMA_HOST_MAPPING="${MAPPING}" docker compose -f "${COMPOSE_FILE}" up -d --build

echo "docker-compose up finished. Active containers:"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

echo "Using static mapping for Ollama. To change, set OLLAMA_HOST_MAPPING to a specific host:container value like '11435:11434'. Randomization is not supported."
