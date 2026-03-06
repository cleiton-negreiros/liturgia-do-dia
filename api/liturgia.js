// api/liturgia.js — usa v2 da API com todas as seções da Missa
const axios = require('axios');
const API_V2 = 'https://liturgia.up.railway.app/v2';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { data } = req.query;
  if (!data) data = new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
    return res.status(400).json({ erro: 'Use AAAA-MM-DD' });

  const [ano, mes, dia] = data.split('-');
  try {
    const resp = await axios.get(`${API_V2}/`, {
      params: { dia, mes, ano },
      timeout: 10000,
      headers: { Accept: 'application/json' }
    });
    return res.status(200).json({ sucesso: true, data, liturgia: resp.data, fonte: API_V2 });
  } catch (e) {
    // fallback para v1
    try {
      const r2 = await axios.get('https://liturgia.up.railway.app/', {
        params: { dia, mes, ano }, timeout: 10000
      });
      return res.status(200).json({ sucesso: true, data, liturgia: r2.data, fonte: 'v1' });
    } catch (e2) {
      return res.status(500).json({ sucesso: false, erro: e2.message, data });
    }
  }
};
