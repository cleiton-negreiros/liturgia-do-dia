// api/laudes.js
// ─────────────────────────────────────────────────────────────
// Busca as Laudes (Liturgia das Horas) da Canção Nova por data
// ─────────────────────────────────────────────────────────────

const axios   = require('axios');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { data } = req.query;
  if (!data) data = new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
    return res.status(400).json({ erro: 'Use AAAA-MM-DD' });

  const [ano, mes, dia] = data.split('-');

  // URL da Canção Nova com parâmetros de data
  const url = `https://liturgia.cancaonova.com/pb/laudes/?sDia=${dia}&sMes=${mes}&sAno=${ano}`;

  try {
    const resp = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LiturgiaApp/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://liturgia.cancaonova.com/pb/'
      }
    });

    const $ = cheerio.load(resp.data);
    const secoes = [];

    // A Canção Nova organiza as Laudes em divs com classe liturgia-content ou similar
    // Extrai cada bloco de título + texto
    const seletores = [
      '.entry-content',
      '.liturgia-content',
      '.post-content',
      'article .content',
      '#content',
      'main'
    ];

    let container = null;
    for (const sel of seletores) {
      if ($(sel).length) { container = $(sel); break; }
    }

    if (container) {
      // Percorre elementos buscando padrão título (h2/h3/strong) + parágrafo
      let secaoAtual = null;

      container.find('h1, h2, h3, h4, strong, p').each((i, el) => {
        const tag  = el.name;
        const texto = $(el).text().trim();

        if (!texto || texto.length < 3) return;

        const ehTitulo = ['h1','h2','h3','h4'].includes(tag) ||
          (tag === 'strong' && texto.length < 60 && !texto.endsWith('.'));

        if (ehTitulo) {
          secaoAtual = { titulo: texto, texto: '' };
          secoes.push(secaoAtual);
        } else if (tag === 'p' && secaoAtual) {
          secaoAtual.texto += (secaoAtual.texto ? '\n' : '') + texto;
        }
      });
    }

    // Fallback: extrai texto geral se não encontrou seções
    if (secoes.length === 0) {
      const textoGeral = $('body').text()
        .replace(/\s{3,}/g, '\n')
        .trim()
        .split('\n')
        .filter(l => l.trim().length > 20)
        .slice(0, 30)
        .join('\n');

      if (textoGeral.length > 100) {
        secoes.push({ titulo: 'Laudes', texto: textoGeral });
      }
    }

    if (secoes.length === 0) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Laudes não encontradas para esta data.',
        url
      });
    }

    return res.status(200).json({
      sucesso: true,
      data,
      secoes,
      url,
      fonte: 'liturgia.cancaonova.com'
    });

  } catch (e) {
    return res.status(500).json({
      sucesso: false,
      erro: `Não foi possível buscar as Laudes: ${e.message}`,
      url,
      data
    });
  }
};
