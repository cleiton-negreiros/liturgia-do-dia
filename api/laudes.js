// api/laudes.js
// A Canção Nova bloqueia scraping server-side (CORS/firewall).
// Retornamos a URL correta para o frontend exibir via iframe ou link.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let { data } = req.query;
  if (!data) data = new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
    return res.status(400).json({ erro: 'Use AAAA-MM-DD' });

  const [ano, mes, dia] = data.split('-');

  // URLs das principais fontes de Laudes
  const urls = {
    cancaoNova:  `https://liturgia.cancaonova.com/pb/laudes/?sDia=${dia}&sMes=${mes}&sAno=${ano}`,
    vaticano:    `https://www.liturgiadelashorasliturgia.com/laudes.php?dia=${dia}&mes=${mes}&ano=${ano}`,
  };

  // Retorna as URLs para o frontend abrir em nova aba
  return res.status(200).json({
    sucesso: true,
    data,
    externo: true,  // sinaliza que o frontend deve abrir externamente
    urls,
    mensagem: 'As Laudes são fornecidas por sites externos.'
  });
};
