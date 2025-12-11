#!/usr/bin/env node
// Simple script to test Ollama endpoint for lyrics/song generation
const axios = require('axios');
const { createNodeLogger } = require('../../tools/logging/node-logger');
const logger = createNodeLogger({ serviceName: 'scripts-ollama-test', logDir: process.env.LOG_DIR || 'tmp/logs/scripts' });

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.argv[2] || process.env.OLLAMA_MODEL || 'minstral3';
const TYPE = process.argv[3] || 'song'; // 'song' or 'metadata'
const narrative = process.argv.slice(4).join(' ') ||
 'A song about the digital dawnthat describes the rise of AIin a world once ruled by humankind, now harmonizing side by side, embracing the future with open minds.';

async function testOllama() {
  try {
    logger.info(`Testing Ollama ${MODEL} for ${TYPE}...`);
    let prompt = '';
    if (TYPE === 'song') {
      prompt = `Return a valid JSON object describing a full song (title, artist, genre, tempo, sections with lyrics and chords) for the following narrative: ${narrative}`;
    } else {
      prompt = `Return a minimal JSON for metadata only: title, lyrics, genre, mood for the following narrative: ${narrative}`;
    }
    const body = {
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 400 }
    };
    const resp = await axios.post(`${OLLAMA_URL}/api/generate`, body, { timeout: 20000 });
    const text = resp.data?.response || resp.data?.text || resp.data?.choices?.[0]?.text || '';
    logger.debug('Raw response');
    logger.debug(text);
    // Try to parse JSON if present
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.slice(start, end + 1);
      try {
        const parsed = JSON.parse(candidate);
        logger.info('Parsed JSON');
        logger.info(JSON.stringify(parsed, null, 2));
        return parsed;
      } catch (err) {
        logger.warn('Failed to parse candidate JSON', { message: err.message });
      }
    }
    return text;
  } catch (err) {
    logger.error('Ollama test failed', { message: err.message || err });
    if (err.response && err.response.data) logger.error('Ollama response', { data: err.response.data });
    process.exit(1);
  }
}

testOllama();
