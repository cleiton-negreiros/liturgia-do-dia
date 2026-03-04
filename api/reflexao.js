// api/reflexao.js
// ─────────────────────────────────────────────────────────────
// Função Serverless — gera reflexão do dia usando Claude (Anthropic)
// Variável de ambiente necessária: ANTHROPIC_API_KEY
// ─────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ erro: 'Use POST' });

  // Verifica se a chave da API está configurada
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      sucesso: false,
      erro: 'Chave da API não configurada. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente do Vercel.'
    });
  }

  // Recebe os dados da liturgia do frontend
  const { evangelho, primeiraLeitura, salmo, data } = req.body || {};

  if (!evangelho?.texto) {
    return res.status(400).json({ sucesso: false, erro: 'Texto do evangelho é obrigatório.' });
  }

  // Monta o prompt com as leituras do dia
  const prompt = `Você é um guia espiritual católico, gentil e profundo.
Com base nas leituras da liturgia do dia, escreva uma reflexão espiritual em português do Brasil.

${primeiraLeitura ? `**1ª LEITURA (${primeiraLeitura.referencia || ''}):**\n${primeiraLeitura.texto}\n` : ''}
${salmo ? `**SALMO (${salmo.referencia || ''}):**\n${salmo.texto}\n` : ''}
**EVANGELHO (${evangelho.referencia || ''}):**
${evangelho.texto}

Escreva uma reflexão com:
- Um parágrafo de abertura conectando as leituras ao dia a dia
- Um ponto central de meditação baseado no Evangelho
- Uma aplicação prática para viver esse ensinamento hoje
- Uma oração breve de encerramento (2-3 linhas)

Seja acolhedor, inspirador e acessível. Use linguagem simples e próxima. Máximo 300 palavras.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // rápido e econômico
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.error?.message || 'Erro na API do Claude');
    }

    const dados = await response.json();
    const reflexao = dados.content?.[0]?.text || '';

    return res.status(200).json({ sucesso: true, reflexao });

  } catch (erro) {
    console.error('Erro ao gerar reflexão:', erro.message);
    return res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível gerar a reflexão: ' + erro.message
    });
  }
};
