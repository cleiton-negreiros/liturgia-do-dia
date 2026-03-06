// api/liturgia.js — normaliza v1 e v2 da API para o mesmo formato
const axios = require('axios');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { data } = req.query;
  if (!data) data = new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
    return res.status(400).json({ erro: 'Use AAAA-MM-DD' });

  const [ano, mes, dia] = data.split('-');

  // Tenta v2 primeiro
  try {
    const resp = await axios.get('https://liturgia.up.railway.app/v2/', {
      params: { dia, mes, ano },
      timeout: 10000,
      headers: { Accept: 'application/json' }
    });
    const raw = resp.data;
    // Normaliza v2 → formato que o frontend espera
    const liturgia = normalizar(raw);
    return res.status(200).json({ sucesso: true, data, liturgia, versao: 'v2' });
  } catch (e1) {
    // Fallback v1
    try {
      const resp = await axios.get('https://liturgia.up.railway.app/', {
        params: { dia, mes, ano },
        timeout: 10000,
        headers: { Accept: 'application/json' }
      });
      return res.status(200).json({ sucesso: true, data, liturgia: resp.data, versao: 'v1' });
    } catch (e2) {
      return res.status(500).json({ sucesso: false, erro: e2.message, data });
    }
  }
};

function normalizar(raw) {
  // v2 tem estrutura: { liturgia, cor, oracoes:{coleta,oferendas,posComunhao,...}, leituras:[...] }
  // v1 tinha: { tipo, primeiraLeitura:{}, salmo:{}, evangelho:{}, aclamacao:{}, ... }
  if (raw.primeiraLeitura || raw.evangelho) return raw; // já é v1, retorna direto

  const out = {};

  // Nome do dia / tempo litúrgico
  out.tipo = raw.liturgia || raw.tipo || '';

  // Orações
  const or = raw.oracoes || {};
  out.coleta          = or.coleta          || or.Coleta          || null;
  out.ofertorio       = or.oferendas       || or.Oferendas       || null;
  out.posComunhao     = or.posComunhao     || or.PosComunhao     || null;
  out.antifonaEntrada = or.entrada         || or.Entrada         || null;
  out.comunhao        = or.comunhao        || or.Comunhao        || null;

  // Leituras — v2 usa array "leituras"
  const leituras = raw.leituras || [];
  leituras.forEach(l => {
    const tipo = (l.tipo || '').toLowerCase();
    if (tipo.includes('primeira') || tipo === '1') {
      out.primeiraLeitura = { referencia: l.referencia, texto: l.texto };
    } else if (tipo.includes('segunda') || tipo === '2') {
      out.segundaLeitura = { referencia: l.referencia, texto: l.texto };
    } else if (tipo.includes('salmo')) {
      out.salmo = { referencia: l.referencia, refrao: l.refrao || l.antifona, texto: l.texto };
    } else if (tipo.includes('aclamacao') || tipo.includes('aclamação')) {
      out.aclamacao = { texto: l.texto };
    } else if (tipo.includes('evangelho')) {
      out.evangelho = { referencia: l.referencia, texto: l.texto };
    }
  });

  // Copia campos que v2 possa ter direto (retrocompatibilidade)
  ['primeiraLeitura','segundaLeitura','salmo','aclamacao','evangelho'].forEach(k => {
    if (raw[k] && !out[k]) out[k] = raw[k];
  });

  return out;
}
