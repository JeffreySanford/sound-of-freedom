# Build stage
FROM python:3.11-slim-bookworm AS build
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY apps/muscgen/requirements.txt ./
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl python3-venv && rm -rf /var/lib/apt/lists/*
# Create a virtual environment in /opt/venv and install requirements into it
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/muscgen .

# Run stage
FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Copy app and virtual environment from build stage
COPY --from=build /app /app
COPY --from=build /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
EXPOSE 4002
CMD ["python", "src/server.py"]
