const express = require('express');
const app = express();
const port = process.env.PORT || 4001;

app.get('/', (req, res) => {
  res.json({ name: 'jen1', status: 'ready' });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.listen(port, () => console.log(`jen1 listening on ${port}`));
