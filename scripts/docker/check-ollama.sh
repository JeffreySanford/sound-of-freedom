#!/usr/bin/env bash
set -euo pipefail

OLLAMA_URL=${OLLAMA_URL:-http://localhost:11434}

if curl -fsS "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
  echo "Ollama is reachable at ${OLLAMA_URL}"
  exit 0
else
  echo "Ollama is not reachable at ${OLLAMA_URL}" >&2
  exit 1
fi
