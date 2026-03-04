// api/liturgia.js
// ─────────────────────────────────────────────────────────────
// Função Serverless (Vercel) — busca liturgia via API gratuita
// Fonte: https://github.com/Dancrf/liturgia-diaria
// Endpoint: https://liturgia.up.railway.app/
// ─────────────────────────────────────────────────────────────

const axios = require('axios');

// API gratuita e open-source de liturgia diária em PT-BR
const API_BASE = 'https://liturgia.up.railway.app';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' });

  // Pega a data da query string, ex: /api/liturgia?data=2026-03-04
  let { data } = req.query;

  if (!data) {
    const hoje = new Date();
    data = hoje.toISOString().split('T')[0];
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return res.status(400).json({ erro: 'Formato inválido. Use AAAA-MM-DD' });
  }

  // Converte "2026-03-04" → parâmetros dia, mes, ano
  const [ano, mes, dia] = data.split('-');

  try {
    const resposta = await axios.get(`${API_BASE}/`, {
      params: { dia, mes, ano },
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });

    return res.status(200).json({
      sucesso: true,
      data,
      liturgia: resposta.data,
      fonte: API_BASE
    });

  } catch (erro) {
    console.error('Erro ao buscar liturgia:', erro.message);
    return res.status(500).json({
      sucesso: false,
      erro: `Não foi possível buscar a liturgia: ${erro.message}`,
      data
    });
  }
};
