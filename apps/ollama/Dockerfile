# Ollama: LLM hosting image (placeholder)
# This image can be used to run Ollama locally in a container.
# Preferred OS: Ubuntu (for driver, GPU, and library compatibility)

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    libssl-dev \
    libcurl4 \
    && rm -rf /var/lib/apt/lists/*

# Install corepack and Node (for tooling) - optional
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*
RUN corepack enable || true

WORKDIR /app
COPY apps/ollama/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 11434

CMD ["/app/entrypoint.sh"]
