const express = require('express');
const app = express();
const axios = require('axios');
const { createClient } = require('redis');

const port = process.env.PORT || 4000;
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

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
      console.warn('Failed to write orchestration result to Redis', redisErr.message);
    }
    res.json({ orchestrator: 'ok', services: responses.map(r => r.data) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to orchestrate services', details: err.message });
  }
});

app.listen(port, () => console.log(`orchestrator listening on ${port}`));

