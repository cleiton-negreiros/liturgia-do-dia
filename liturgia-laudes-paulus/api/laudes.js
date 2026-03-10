// api/laudes.js — scraping das Laudes da Paulus Editora
const axios   = require('axios');
const cheerio = require('cheerio');

const URL_PAULUS = 'https://www.paulus.com.br/portal/liturgia-diaria-das-horas/';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { data } = req.query;
  if (!data) data = new Date().toISOString().split('T')[0];

  const hoje = new Date().toISOString().split('T')[0];
  const ehHoje = (data === hoje);

  try {
    const resp = await axios.get(URL_PAULUS, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });

    const $ = cheerio.load(resp.data);
    $('script, style, nav, header, footer, .menu, .sidebar, .widget, iframe').remove();

    // Encontra o container de conteúdo
    const seletores = ['.entry-content', '.post-content', 'article', '#content', 'main'];
    let container = null;
    for (const sel of seletores) {
      if ($(sel).length) { container = $(sel).first(); break; }
    }
    if (!container) container = $('body');

    const textoCompleto = container.text().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    // Extrai bloco das Laudes
    const idxLaudes = textoCompleto.toUpperCase().indexOf('LAUDES');
    if (idxLaudes === -1) {
      return res.status(200).json({ sucesso: false, erro: 'Conteúdo não encontrado.', url: URL_PAULUS, ehHoje });
    }

    let textoLaudes = textoCompleto.substring(idxLaudes);
    // Para antes das Vésperas (seção seguinte)
    const idxVesp = textoLaudes.toUpperCase().indexOf('VÉSPERAS');
    if (idxVesp > 100) textoLaudes = textoLaudes.substring(0, idxVesp);

    // Divide em seções pelos blocos numerados (1. Hino, 2. Salmo, etc.)
    const secoes = [];
    const partes = textoLaudes.split(/(\d+\.\s+[A-ZÁÉÍÓÚÃÕÇ][^\n]{3,60})/);

    if (partes[0].trim()) secoes.push({ titulo: '', texto: partes[0].trim() });

    for (let i = 1; i < partes.length - 1; i += 2) {
      const titulo = partes[i].trim();
      const texto  = (partes[i + 1] || '').trim();
      if (titulo) secoes.push({ titulo, texto });
    }

    if (secoes.length <= 1) {
      secoes.length = 0;
      secoes.push({ titulo: 'Laudes', texto: textoLaudes.trim() });
    }

    return res.status(200).json({ sucesso: true, data, ehHoje, secoes, url: URL_PAULUS, fonte: 'Paulus Editora' });

  } catch (e) {
    return res.status(500).json({ sucesso: false, erro: e.message, url: URL_PAULUS, ehHoje, data });
  }
};
