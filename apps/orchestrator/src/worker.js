const { createClient } = require('redis');
// S3 is intentionally optional. We prefer to store job results in Mongo via the API.
// If ARTIFACT_S3_BUCKET is configured, S3 upload can be enabled, but by default
// worker will not write to disk or S3 and will send results directly to API for persistence.
let s3 = null;
let S3_ENABLED = false;
const ARTIFACT_BUCKET = process.env.ARTIFACT_S3_BUCKET || '';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
let S3_PUT_OBJECT = null;
if (ARTIFACT_BUCKET) {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    s3 = new S3Client({ region: AWS_REGION });
    S3_PUT_OBJECT = PutObjectCommand;
    S3_ENABLED = true;
  } catch (e) {
    logger.warn('AWS SDK not installed, skipping S3 upload', { message: e.message });
    S3_ENABLED = false;
  }
}
const axios = require('axios');
// file-system usage removed; prefer persistence via API/MongoDB
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createNodeLogger } = require('../../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'orchestrator-worker', logDir: process.env.LOG_DIR || 'tmp/logs/orchestrator' });

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const streamKey = process.env.JOBS_STREAM || 'jobs:stream';
const groupName = process.env.JOBS_GROUP || 'jobs_group';
const consumerName = process.env.JOBS_CONSUMER || `consumer-${uuidv4().slice(0, 8)}`;
const artifactDir = process.env.ARTIFACT_DIR || null;
// By default, do not write artifacts to the local file system. Enable via WORKER_WRITE_ARTIFACTS=1.
const WRITE_ARTIFACTS = process.env.WORKER_WRITE_ARTIFACTS === '1';
const maxRetries = Number(process.env.MAX_RETRIES || 3);
const concurrency = Number(process.env.WORKER_CONCURRENCY || 2);

logger.info('Worker starting', { redisUrl, streamKey, groupName, consumerName, artifactDir, maxRetries });

async function ensureGroup(redis) {
  try {
    await redis.xGroupCreate(streamKey, groupName, '$', { MKSTREAM: true });
    logger.info('Created group', { groupName });
  } catch (err) {
    // Group may already exist
    if (!err.message.includes('BUSYGROUP')) {
      logger.warn('Failed to create group', { message: err.message });
    }
  }
}

async function processMessage(redis, id, fields) {
  const jobId = fields.jobId || fields.id || fields.JOB_ID || fields.JOBID;
  if (!jobId) {
    logger.warn('Message without jobId', { id, fields });
    return;
  }
    const jobKey = `job:${jobId}`;
  const raw = await redis.hGetAll(jobKey);
  const job = raw || {};
  // Support request ID propagation for tracing across services. If the job
  // record already contains a requestId, use that; otherwise read from the
  // stream message fields, or generate a new one. Persist the generated
  // requestId for later correlation.
  const requestId = job.requestId || fields.requestId || uuidv4();
  if (!job.requestId && requestId) {
    try { await redis.hSet(jobKey, { requestId }); } catch (e) { /* ignore */ }
  }
  const attempts = Number(job.attempts || 0);
  try {
    await redis.hSet(jobKey, { status: 'processing', startedAt: Date.now(), attempts: attempts + 1 });
    logger.info('Processing job', { jobId, requestId });
    const jen1Url = process.env.JEN1_URL || 'http://jen1:4001';
    const jen1Headers = {};
    if (requestId) jen1Headers['X-Request-Id'] = requestId;
    const resp = await axios.post(`${jen1Url}/generate`, { narrative: job.narrative, duration: Number(job.duration), options: JSON.parse(job.options || '{}') }, { timeout: 120000, headers: jen1Headers });
    const resultData = resp.data;
    // Prefer to store the result directly in the API/MongoDB rather than writing to disk.
    let artifactPath = '';
    let artifactUrl = null;
    if (WRITE_ARTIFACTS && artifactDir) {
      try {
        fs.mkdirSync(artifactDir, { recursive: true });
        artifactPath = path.join(artifactDir, `job-${jobId}.json`);
        fs.writeFileSync(artifactPath, JSON.stringify(resultData, null, 2));
      } catch (e) {
        logger.warn('Failed to write artifact to disk', { message: (e && e.message) || e });
        artifactPath = '';
      }
    }
    if (S3_ENABLED && s3 && WRITE_ARTIFACTS && artifactPath) {
      try {
        const key = `jen1/artifacts/job-${jobId}.json`;
        const body = JSON.stringify(resultData, null, 2);
        await s3.send(new S3_PUT_OBJECT({ Bucket: ARTIFACT_BUCKET, Key: key, Body: body }));
        artifactUrl = `s3://${ARTIFACT_BUCKET}/${key}`;
      } catch (e) {
        logger.warn('Failed to upload artifact to S3', { message: (e && e.message) || e });
        artifactUrl = null;
      }
    }
    await redis.hSet(jobKey, { status: 'completed', completedAt: Date.now(), result: JSON.stringify(resultData), artifact: artifactPath || '', artifactUrl: artifactUrl || '' });
    await redis.xAck(streamKey, groupName, id);
    // notify API
    const headers = {};
    if (process.env.ORCHESTRATOR_TOKEN) headers['Authorization'] = `Bearer ${process.env.ORCHESTRATOR_TOKEN}`;
    if (requestId) headers['X-Request-Id'] = requestId;
    logger.info('Reporting completed job to API', { jobId, requestId, artifactUrl });
    await axios.post(`${process.env.API_URL || 'http://api:3000'}/jobs/report`, { jobId, type: 'completed', payload: { job: { id: jobId, artifact: artifactPath || '', artifactUrl, result: resultData } } }, { headers }).catch(e => logger.warn('Failed to report completion', { message: e.message }));
  } catch (err) {
    logger.error('Worker error for job', { jobId, attempts, requestId, error: err.message || err });
    const newAttempts = attempts + 1;
    if (newAttempts >= maxRetries) {
      await redis.hSet(jobKey, { status: 'failed', failedAt: Date.now(), attempts: newAttempts, error: (err.message || 'error') });
      await redis.xAck(streamKey, groupName, id);
        // push message to dead-letter stream for inspection
        await redis.xAdd(`${streamKey}:dead`, '*', { jobId, error: (err.message || 'failed'), attempts: String(newAttempts) });
      try { logger.info('Reporting failed job to API', { jobId, requestId, error: err.message || err }); await axios.post(`${process.env.API_URL || 'http://api:3000'}/jobs/report`, { jobId, type: 'failed', payload: { userId: job.userId || 'unknown', error: err.message || err } }, { headers }).catch(e => logger.warn('Report failed', { message: e.message })); } catch (e) { logger.warn('Report failed', { message: e.message }); }
    } else {
      // Increment attempts and push back to stream for retry
      await redis.hSet(jobKey, { attempts: newAttempts });
      await redis.xAdd(streamKey, '*', { jobId, retryCount: newAttempts });
      await redis.xAck(streamKey, groupName, id);
    }
  }
}

async function runWorker() {
  const redis = createClient({ url: redisUrl });
  await redis.connect();
  logger.info('Worker connected to Redis');
  await ensureGroup(redis);
  while (true) {
    try {
      // read messages with a block
      const messages = await redis.xReadGroup(groupName, consumerName, { key: streamKey, id: '>' }, { COUNT: concurrency, BLOCK: 0 });
      if (messages && messages.length > 0) {
        for (const stream of messages) {
          // Process all messages in this read in parallel up to concurrency
          await Promise.all(
            stream.messages.map((msg) => {
              const id = msg.id;
              const fields = msg.message || {};
              return processMessage(redis, id, fields);
            })
          );
        }
      }
    } catch (err) {
      logger.error('Worker loop error', { message: err.message || err });
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

runWorker().catch((err) => {
  logger.error('Worker failed', { message: err.message || err });
  process.exit(1);
});
