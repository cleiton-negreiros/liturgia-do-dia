// api/biblia.js — Proxy para getbible.net com normalização
// Parâmetros: ?lang=pt&book=GEN&cap=1

const TRADUCOES = {
  pt: { abbrev: 'almeida', nome: 'Almeida Revista e Corrigida' },
  es: { abbrev: 'valera',  nome: 'Reina-Valera 1909'           },
  it: { abbrev: 'riveduta',nome: 'Riveduta'                    },
  en: { abbrev: 'kjv',     nome: 'King James Version'          },
};

// Mapeamento: ID do livro → número no canon protestante (getbible usa 1-66)
const BOOK_NUM = {
  GEN:1, EXO:2, LEV:3, NUM:4, DEU:5, JOS:6, JDG:7, RUT:8, '1SA':9, '2SA':10,
  '1KI':11,'2KI':12,'1CH':13,'2CH':14, EZR:15, NEH:16, EST:17, JOB:18, PSA:19,
  PRO:20, ECC:21, SNG:22, ISA:23, JER:24, LAM:25, EZK:26, DAN:27, HOS:28, JOL:29,
  AMO:30, OBA:31, JON:32, MIC:33, NAM:34, HAB:35, ZEP:36, HAG:37, ZEC:38, MAL:39,
  MAT:40, MRK:41, LUK:42, JHN:43, ACT:44, ROM:45, '1CO':46,'2CO':47, GAL:48,
  EPH:49, PHP:50, COL:51, '1TH':52,'2TH':53,'1TI':54,'2TI':55, TIT:56, PHM:57,
  HEB:58, JAS:59, '1PE':60,'2PE':61,'1JN':62,'2JN':63,'3JN':64, JUD:65, REV:66,
  // Deuterocanônicos — não estão na numeração protestante
  TOB:null, JDT:null, '1MA':null, '2MA':null, WIS:null, SIR:null, BAR:null,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { lang = 'pt', book = 'GEN', cap = '1' } = req.query;

  const trad = TRADUCOES[lang] || TRADUCOES.pt;
  const bookNum = BOOK_NUM[book.toUpperCase()];

  if (bookNum === null) {
    return res.json({
      sucesso: false,
      deuterocanonico: true,
      mensagem: `O livro "${book}" é deuterocanônico e não está disponível na tradução "${trad.nome}". Tente a versão em inglês (KJV) ou acesse uma Bíblia Católica impressa para este livro.`
    });
  }

  if (!bookNum) {
    return res.json({ sucesso: false, mensagem: `Livro "${book}" não reconhecido.` });
  }

  try {
    const url = `https://api.getbible.net/v2/${trad.abbrev}/${bookNum}/${cap}.json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`getbible.net retornou ${r.status}`);
    const data = await r.json();

    // getbible.net retorna verses como objeto: {"1":{verse,text}, "2":...} OU array
    let versiculos = [];
    if (Array.isArray(data.verses)) {
      versiculos = data.verses.map(v => ({ num: v.verse, txt: v.text?.trim() }));
    } else if (data.verses && typeof data.verses === 'object') {
      versiculos = Object.values(data.verses).map(v => ({ num: v.verse, txt: v.text?.trim() }));
    }

    if (versiculos.length === 0) throw new Error('Nenhum versículo retornado.');

    res.json({
      sucesso: true,
      traducao: trad.nome,
      abbrev: trad.abbrev,
      livro: data.book_name || book,
      capitulo: Number(cap),
      versiculos,
    });
  } catch (e) {
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};
