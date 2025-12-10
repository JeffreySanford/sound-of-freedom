#!/bin/sh
set -e

HOST_API=${HOST_API:-host.docker.internal}
HOST_FRONTEND=${HOST_FRONTEND:-host.docker.internal}
API_PORT=${API_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-4200}
JEN1_PORT=${JEN1_PORT:-4001}
MUSCGEN_PORT=${MUSCGEN_PORT:-4002}
REDIS_PORT=${REDIS_PORT:-6379}
OLLAMA_PORT=${OLLAMA_PORT:-11434}

echo "Orchestrator waiting for internal services (jen1, muscgen, redis, ollama)..."
wait_for() {
  host=$1; port=$2
  echo "Waiting for $host:$port..."
  while ! nc -z -w 2 $host $port; do
    echo "$host:$port not ready yet..."; sleep 1
  done
  echo "$host:$port is up"
}

wait_for_either() {
  host1=$1; host2=$2; port=$3
  echo "Waiting for either $host1:$port or $host2:$port..."
  while true; do
    if nc -z -w 2 $host1 $port; then
      echo "$host1:$port is up"; break
    fi
    if nc -z -w 2 $host2 $port; then
      echo "$host2:$port is up"; break
    fi
    echo "Neither $host1 nor $host2 is up on port $port yet..."; sleep 1
  done
}

# Check internal docker services (resolve via internal compose network hostnames)
wait_for jen1 $JEN1_PORT
wait_for muscgen $MUSCGEN_PORT
wait_for redis $REDIS_PORT
wait_for ollama $OLLAMA_PORT

echo "Orchestrator waiting for API (host) $HOST_API:$API_PORT and frontend $HOST_FRONTEND:$FRONTEND_PORT"
wait_for_either api $HOST_API $API_PORT
wait_for_either frontend $HOST_FRONTEND $FRONTEND_PORT

echo "All dependencies are available. Starting orchestrator..."
exec node src/index.js
