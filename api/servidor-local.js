const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();
const PORT    = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/liturgia', (req, res) => require('./liturgia')(req, res));
app.get('/api/laudes',   (req, res) => require('./laudes')(req, res));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✝  Liturgia do Dia rodando!\n👉 http://localhost:${PORT}\n`);
});
