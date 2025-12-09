# Orchestrator Overview

The orchestrator is responsible for coordinating microservices (jen1, muscgen), job queues, and shared infrastructure.
It is the component responsible for scheduling generation jobs and managing shared resources such as Redis and the API
endpoints.

Responsibilities

- Manage orchestration of generation pipelines (trigger jen1 then muscgen)
- Use Redis for job queuing, caching results, and cross-service coordination.
- Provide an admin API for job monitoring and orchestration state.

Preferred OS & runtime

- Ubuntu 22.04 LTS as Docker base is recommended.
- The orchestrator image is lightweight and can be Node.js-based (as implemented in this repo), with `redis` as runtime
  dependency.

Service configuration

- Expose endpoints: `/compose`, `/jobs` (list/submit), `/health`.

- Environment variables:

  - `JEN1_URL` (http URL of jen1 service)
  - `MUSCGEN_URL` (http URL of muscgen service)
  - `REDIS_URL` (redis connection string)
  - `OLLAMA_URL` (if using Ollama for model orchestration)

Integration pattern

1. Receive a job request (API call)

2. Push job to Redis queue, then return job ID

3. Worker (or the orchestrator) consumes the queue, calls jen1 (metadata), and then schedules muscgen to generate audio

4. Cache results in Redis and notify frontend via WebSocket or polling

Scaling

- Use multiple orchestrator replicas with a worker pool for queue consumption.
- Use Redis streams or Redis-based priority queues to ensure resilience and ordering.

Security

- Protect endpoints with adequate authentication and rate limiting
- Ensure Redis connections are secured behind VPC or using TLS

\*\*\* End Orchestrator Overview
