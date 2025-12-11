const express = require('express');
// Use built-in express.json() instead of external body-parser dependency.
const cors = require('cors');
const app = express();
const { createNodeLogger } = require('../../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'ollama-mock', logDir: process.env.LOG_DIR || 'tmp/logs/ollama-mock' });
app.use(cors());
app.use(express.json());

app.get('/api/tags', (req, res) => {
  res.json({ models: [{ name: 'deepseek' }, { name: 'deepseek-coder:6.7b' }, { name: 'mistral:7b' }, { name: 'minstral3' }] });
});

app.post('/api/generate', (req, res) => {
  res.json({ response: JSON.stringify({ title: 'Mocked Title', lyrics: 'Mock lyrics' }) });
});

app.post('/v1/completions', (req, res) => {
  res.json({ choices: [{ text: JSON.stringify(['Pop', 'Rock']) }] });
});

app.listen(11434, () => logger.info('Ollama-mock listening on 11434'));