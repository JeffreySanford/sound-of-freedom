const express = require('express');
const app = express();
const axios = require('axios');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const promClient = require('prom-client');
const { createNodeLogger } = require('../../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'orchestrator', logDir: process.env.LOG_DIR || path.join(process.cwd(), 'tmp', 'logs', 'orchestrator') });

const port = process.env.PORT || 4000;
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const fs = require('fs');
const artifactDir = process.env.ARTIFACT_DIR || null;

// Prometheus metrics endpoint: register early for route handlers
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();
const jobsSubmitted = new promClient.Counter({ name: 'orchestrator_jobs_submitted_total', help: 'Total jobs submitted' });
const jobsCompleted = new promClient.Counter({ name: 'orchestrator_jobs_completed_total', help: 'Total jobs completed' });

// Ensure artifact dir exists if configured
if (artifactDir) {
  try { fs.mkdirSync(artifactDir, { recursive: true }); } catch (e) {}
}

app.get('/', (req, res) => {
  res.json({ name: 'orchestrator', status: 'ready' });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Example endpoint that calls other services if they are available
app.get('/compose', async (req, res) => {
  try {
    const responses = await Promise.all([
      axios.get(process.env.JEN1_URL || 'http://jen1:4001/'),
      axios.get(process.env.MUSCGEN_URL || 'http://muscgen:4002/')
    ]);
    // Simple example: store orchestration result in redis cache with a timestamp
    try {
      const redis = createClient({ url: redisUrl });
      await redis.connect();
      await redis.set(`orchestrator:${Date.now()}`, JSON.stringify(responses.map(r => r.data)), { EX: 60 * 10 });
      await redis.disconnect();
    } catch (redisErr) {
      logger.warn('Failed to write orchestration result to Redis', { message: redisErr.message });
    }
    res.json({ orchestrator: 'ok', services: responses.map(r => r.data) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to orchestrate services', details: err.message });
  }
});

// Job queue endpoint — submit job, push to redis list
app.post('/jobs', express.json(), async (req, res) => {
  try {
    const payload = req.body || {};
    const jobId = uuidv4();
    const jobKey = `job:${jobId}`;
    const createdAt = Date.now();
    const requestId = req.headers['x-request-id'] || uuidv4();
    const job = {
      id: jobId,
      narrative: payload.narrative || '',
      duration: payload.duration || 30,
      model: payload.model || 'jen1',
      options: JSON.stringify(payload.options || {}),
      requestId,
      status: 'queued',
      createdAt,
    };

    const redis = createClient({ url: redisUrl });
    await redis.connect();
    await redis.hSet(jobKey, job);
    // Add job to Redis stream for worker consumption
    await redis.xAdd('jobs:stream', '*', {
      jobId: jobId,
      narrative: job.narrative,
      duration: String(job.duration),
      model: job.model,
      options: JSON.stringify(job.options || {}),
      requestId,
    });
    await redis.disconnect();

    // increment prometheus counter
    jobsSubmitted.inc();
    logger.info('Job submitted', { jobId, requestId });

    res.status(202).json({ jobId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit job', details: err.message });
  }
});

// Job status endpoint — read job from redis
app.get('/jobs/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const redis = createClient({ url: redisUrl });
    await redis.connect();
    const job = await redis.hGetAll(`job:${jobId}`);
    await redis.disconnect();
    if (!job || Object.keys(job).length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve job', details: err.message });
  }
});

// POST endpoint to orchestrate a generation request between internal services
app.post('/compose', express.json(), async (req, res) => {
  try {
    const payload = req.body || {};
    // Forward generate request to jen1 if available
    const jen1Url = process.env.JEN1_URL || 'http://jen1:4001';
    const muscgenUrl = process.env.MUSCGEN_URL || 'http://muscgen:4002';

    const headers = {};
    const requestId = req.headers['x-request-id'] || uuidv4();
    headers['X-Request-Id'] = requestId;
    logger.info('Orchestrator compose calling jen1', { requestId });
    const jen1Resp = await axios.post(`${jen1Url}/generate`, payload, { timeout: 60_000, headers });
    // For PoC we focus on jen1; in future add audio generation from muscgen
    res.json({ orchestrator: 'ok', jen1: jen1Resp.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to orchestrate services', details: err.message });
  }
});

app.listen(port, () => logger.info(`orchestrator listening on ${port}`));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});

// The worker has been externalized to `src/worker.js` for scaling and separation of concerns.

