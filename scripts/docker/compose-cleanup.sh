#!/usr/bin/env bash
set -euo pipefail

# Stop and remove sound-creator containers and images built locally.
# Use with care; this deletes project's containers and images only.

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}

echo "Stopping and removing sound-creator containers..."
# Stop any running containers for this project (by name prefix 'sound-creator')
for container in $(docker ps -a --format '{{.Names}}' | grep '^sound-creator-' || true); do
  echo "Stopping and removing container: ${container}"
  docker stop "${container}" || true
  docker rm -f "${container}" || true
done

echo "Removing local sound-creator images..."
for image in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep '^sound-creator-' || true); do
  echo "Removing image: ${image}"
  docker rmi -f "${image}" || true
done

echo "Pruning dangling system resources"
docker image prune -f || true
docker container prune -f || true
docker volume prune -f || true

echo "Cleanup completed."
