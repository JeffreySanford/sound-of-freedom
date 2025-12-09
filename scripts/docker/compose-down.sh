#!/usr/bin/env bash
set -euo pipefail

# Simple docker compose stop and cleanup script for the repo
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}

echo "Stopping docker compose stack (${COMPOSE_FILE}) and removing containers..."
docker compose -f "${COMPOSE_FILE}" down --remove-orphans

echo "All containers removed from the compose stack."
