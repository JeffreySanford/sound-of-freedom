const express = require('express');
const app = express();
const port = process.env.PORT || 4002;

app.get('/', (req, res) => {
  res.json({ name: 'muscgen', status: 'ready' });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.listen(port, () => console.log(`muscgen listening on ${port}`));
