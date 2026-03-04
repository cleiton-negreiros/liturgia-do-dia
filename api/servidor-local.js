// api/servidor-local.js
// ─────────────────────────────────────────────────────────────
// Servidor Express para testar LOCALMENTE antes de subir ao Vercel
// Execute: node api/servidor-local.js
// Acesse:  http://localhost:3000
// ─────────────────────────────────────────────────────────────

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const handler = require('./liturgia'); // reusa a mesma função do Vercel

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../public')));

// Rota da API — simula o ambiente Vercel localmente
app.get('/api/liturgia', (req, res) => {
  handler(req, res);
});

// Qualquer outra rota serve o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log('');
  console.log('✝  Servidor da Liturgia do Dia rodando!');
  console.log(`👉 Abra no navegador: http://localhost:${PORT}`);
  console.log(`🔌 API disponível em: http://localhost:${PORT}/api/liturgia`);
  console.log('');
  console.log('Pressione Ctrl+C para parar.');
});
