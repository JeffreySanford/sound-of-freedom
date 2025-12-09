# Build stage
FROM python:3.11-slim-bullseye AS build
WORKDIR /app
COPY apps/muscgen/requirements.txt ./
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/muscgen .

# Run stage
FROM python:3.11-slim-bullseye
WORKDIR /app
COPY --from=build /app .
EXPOSE 4002
CMD ["python", "src/server.py"]
