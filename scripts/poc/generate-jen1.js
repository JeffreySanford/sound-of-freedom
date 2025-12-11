#!/usr/bin/env node
// Minimal PoC script to call the API generate-song endpoint with model=jen1 and query Ollama for structured lyrics
const axios = require('axios');
const { createNodeLogger } = require('../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'poc-generate-jen1', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' });

function extractJsonFromText(text) {
  const cleaned = (text || '').trim();
  try { return JSON.parse(cleaned); } catch (e) {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  const candidate = cleaned.substring(start, end + 1);
  try { return JSON.parse(candidate); } catch (e) {}
  return null;
}

async function queryOllama(prompt, model) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const body = {
    model: model || process.env.OLLAMA_MODEL || 'deepseek',
    prompt: prompt,
    stream: false,
    options: { temperature: 0.3, num_predict: 400 }
  };
  try {
    const resp = await axios.post(`${ollamaUrl}/api/generate`, body, { timeout: 60000 });
    const text = resp.data && (resp.data.response || resp.data.text || resp.data.choices?.[0]?.text) || '';
    const json = extractJsonFromText(text);
    return json || { response: text };
  } catch (err) {
    throw new Error(`Ollama call failed: ${err.message || err}`);
  }
}

async function main() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const narrative = process.argv[2] || 'A melancholic story of code and music';
  const duration = parseInt(process.argv[3] || '45', 10);
  const model = process.env.OLLAMA_MODEL || 'minstral3';

  // Build a prompt similar to OllamaService.generateSong
  const prompt = `Generate a complete song JSON for the following narrative. Only return valid JSON.\nNarrative: ${narrative}\nDuration: ${duration}`;
  try {
    logger.info('Querying Ollama for structured song output...');
    const songJson = await queryOllama(prompt, model);
    logger.info('Ollama response (parsed JSON)', { parsed: songJson });

    // Post to API: include songJson in options to annotate job
      const body = {
        narrative: narrative,
        duration: duration,
        model: 'jen1',
      async: true,
      options: { generatedSong: songJson },
    };

    logger.info('Submitting job to API (async) with generatedSong in options...');
    const headers = {};
    if (process.env.API_TOKEN) headers['Authorization'] = `Bearer ${process.env.API_TOKEN}`;
    const resp = await axios.post(`${apiUrl}/api/songs/generate-song`, body, { timeout: 60000, headers });
    logger.info('API Response', { data: resp.data });
    if (resp.data?.jobId) {
      logger.info(`Job submitted, jobId=${resp.data.jobId}`, { jobId: resp.data.jobId });
    }
  } catch (err) {
    logger.error('Error:', { message: err.message || err });
    if (err.response && err.response.data) logger.error('Response data', { data: err.response.data });
  }
}

main();
