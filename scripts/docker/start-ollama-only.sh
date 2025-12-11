#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.dev.example.yml}
OLLAMA_HOST_MAPPING=${OLLAMA_HOST_MAPPING:-11434:11434}

echo "Starting Ollama via ${COMPOSE_FILE}" 

# Start only the ollama service
docker compose -f "${COMPOSE_FILE}" up -d --build ollama

# Wait for Ollama to accept connections
OLLAMA_URL=${OLLAMA_URL:-http://localhost:11434}

attempts=0
max_attempts=15
while [ $attempts -lt $max_attempts ]; do
  if curl -fsS "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    echo "Ollama is reachable at ${OLLAMA_URL}"
    exit 0
  fi
  attempts=$((attempts + 1))
  echo "Waiting for Ollama (${attempts}/${max_attempts})..."
  sleep 2
done

echo "Failed to reach Ollama at ${OLLAMA_URL} after ${max_attempts} attempts" >&2
curl -v "${OLLAMA_URL}/api/tags" || true
exit 1
