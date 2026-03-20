// api/auth-verify.js
// ──────────────────────────────────────────────────────────────────
// AULA: O que este arquivo faz?
//
// Quando o usuário clica em "Entrar com Google", o Google devolve
// um "credential" (token JWT). Esse token é uma string longa que
// contém nome, email e foto — MAS precisamos verificar que ele
// realmente veio do Google e não foi falsificado por alguém.
//
// Este arquivo recebe o token, verifica com o Google, e devolve
// os dados do usuário ao frontend.
//
// ANALOGIA: é como ligar para o banco para confirmar se um cheque
// é verdadeiro antes de aceitar o pagamento.
// ──────────────────────────────────────────────────────────────────

const { OAuth2Client } = require('google-auth-library');

// O CLIENT_ID identifica QUAL aplicativo está pedindo o login.
// Você vai criar esse ID no Google Cloud Console (passo a passo abaixo).
// Nunca escreva o ID diretamente aqui — use variável de ambiente.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(CLIENT_ID);

module.exports = async (req, res) => {
  // Permite que o navegador chame esta rota
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS é uma "pré-verificação" que o navegador faz antes de POST
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { credential } = req.body;
  if (!credential) return res.status(400).json({ erro: 'Token não fornecido' });

  try {
    // VERIFICAÇÃO: pergunta ao Google "esse token é legítimo?"
    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: CLIENT_ID,
    });

    // Se chegou aqui, o token é válido! Extraímos os dados do usuário.
    const payload = ticket.getPayload();

    // Devolvemos ao frontend só o que precisamos
    res.json({
      sucesso: true,
      usuario: {
        id:    payload.sub,     // ID único do usuário no Google
        nome:  payload.name,    // Nome completo: "João Silva"
        email: payload.email,   // email@gmail.com
        foto:  payload.picture, // URL da foto de perfil
      }
    });

  } catch (erro) {
    // Token inválido, expirado ou falsificado
    console.error('Erro ao verificar token:', erro.message);
    res.status(401).json({ sucesso: false, erro: 'Token inválido' });
  }
};
