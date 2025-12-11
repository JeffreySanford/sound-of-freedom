#!/usr/bin/env bash

# Attempt to start the Ollama binary if present; otherwise remain idle so the container can be used as a placeholder
echo "Ollama container placeholder started - checking for Ollama binary..."
if [ -x "/opt/ollama/bin/ollama" ]; then
	echo "Found Ollama binary at /opt/ollama/bin/ollama"

	# If OLLAMA_AUTO_PULL=1 or OLLAMA_PULL_MODELS is set, attempt to pull any missing models.
	# Default to three recommended models if OLLAMA_PULL_MODELS is not set.
	if [ "${OLLAMA_AUTO_PULL}" = "1" ] || [ -n "${OLLAMA_PULL_MODELS}" ]; then
		PULL_LIST=${OLLAMA_PULL_MODELS:-${OLLAMA_AVAILABLE_MODELS:-"minstral3,deepseek-coder:6.7b,mistral:7b"}}
		echo "OLLAMA: auto-pull enabled; models to ensure: ${PULL_LIST}"
		IFS=',' read -r -a MODELS <<< "$PULL_LIST"
		for m in "${MODELS[@]}"; do
			mod=$(echo "$m" | xargs) # trim whitespace
			if [ -z "$mod" ]; then continue; fi
			# Check if model directory exists under the default Ollama models path
			MODEL_DIR1="/root/.ollama/models/$mod"
			MODEL_DIR2="/home/ollama/.ollama/models/$mod"
			if [ -d "$MODEL_DIR1" ] || [ -d "$MODEL_DIR2" ]; then
				echo "Ollama model '$mod' already present; skipping pull"
				continue
			fi
			echo "Attempting to pull Ollama model: $mod"
			set +e
			/opt/ollama/bin/ollama pull "$mod"
			rc=$?
			set -e
			if [ $rc -ne 0 ]; then
				echo "Warning: failed to pull model $mod (exit $rc). Continuing; model may not be available." >&2
			else
				echo "Successfully pulled model $mod"
			fi
		done
	fi

	echo "Starting Ollama serve on port 11434"
	exec /opt/ollama/bin/ollama serve --port 11434
fi
# Here you would typically run the Ollama binary or start a process that runs the LLM server.
# Example (commented since the binary may not be present):
# /opt/ollama/bin/ollama serve --model <model> --port 11434

# Fallback to sleep loop for the placeholder container
while true; do sleep 3600; done
