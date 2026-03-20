// api/biblia-busca.js
// ──────────────────────────────────────────────────────────────────
// AULA: Dois modos de busca na Bíblia
//
// MODO 1 — REFERÊNCIA: usuário digita "Jo 3,16" ou "Genesis 1:1"
//   → Parseamos o texto para extrair livro, capítulo, versículo
//   → Navegamos diretamente para aquele ponto
//   → Retornamos o versículo exato em destaque
//
// MODO 2 — PALAVRA: usuário digita "amor" ou "ressurreição"
//   → Percorremos os livros do Novo Testamento (mais relevante)
//   → Buscamos versículos que contêm a palavra
//   → Retornamos lista de resultados
//
// Por que só o NT na busca por palavra?
//   O Novo Testamento tem 27 livros. Buscar nos 73 do canon católico
//   exigiria centenas de chamadas à API — muito lento. O NT cobre
//   os textos mais buscados. Podemos expandir no futuro.
// ──────────────────────────────────────────────────────────────────

// Traduções por idioma (mesmas do api/biblia.js)
const TRADUCOES = {
  pt: 'almeida',
  es: 'valera',
  it: 'riveduta',
  en: 'kjv',
};

// Mapeamento de nomes de livros em múltiplos idiomas → ID e número
// Inclui abreviações comuns que o usuário pode digitar
const LIVROS_MAP = [
  // Formato: { id: 'GEN', num: 1, aliases: [...nomes em pt/es/it/en...] }
  { id:'GEN', num:1,  aliases:['genesis','gênesis','gn','gen'] },
  { id:'EXO', num:2,  aliases:['êxodo','exodo','ex','exo','éxodo'] },
  { id:'LEV', num:3,  aliases:['levítico','levitico','lv','lev'] },
  { id:'NUM', num:4,  aliases:['números','numeros','nm','num','numeri'] },
  { id:'DEU', num:5,  aliases:['deuteronômio','deuteronomio','dt','deu','deut'] },
  { id:'JOS', num:6,  aliases:['josué','josue','js','jos'] },
  { id:'JDG', num:7,  aliases:['juízes','juizes','jz','jdg','jueces','giudici','judges'] },
  { id:'RUT', num:8,  aliases:['rute','rut','rt'] },
  { id:'1SA', num:9,  aliases:['1samuel','1sm','1sa','1 samuel','1 sm'] },
  { id:'2SA', num:10, aliases:['2samuel','2sm','2sa','2 samuel','2 sm'] },
  { id:'1KI', num:11, aliases:['1reis','1rs','1ki','1 reis','1reyes','1re'] },
  { id:'2KI', num:12, aliases:['2reis','2rs','2ki','2 reis','2reyes','2re'] },
  { id:'PSA', num:19, aliases:['salmos','salmo','sl','ps','psa','sal','salmi'] },
  { id:'PRO', num:20, aliases:['provérbios','proverbios','pv','pro','prv','proverbi'] },
  { id:'ECC', num:21, aliases:['eclesiastes','ec','ecc','qo','qoelet','qohelet'] },
  { id:'SNG', num:22, aliases:['cântico','cantico','ct','sng','cantares','cantar'] },
  { id:'ISA', num:23, aliases:['isaías','isaias','is','isa','isaia'] },
  { id:'JER', num:24, aliases:['jeremias','jr','jer','geremia'] },
  { id:'LAM', num:25, aliases:['lamentações','lamentacoes','lm','lam','lamentazioni'] },
  { id:'EZK', num:26, aliases:['ezequiel','ez','ezk','ezechiele'] },
  { id:'DAN', num:27, aliases:['daniel','dn','dan','daniele'] },
  { id:'HOS', num:28, aliases:['oseias','oseas','os','hos','osea'] },
  { id:'JON', num:32, aliases:['jonas','jon','giona','jonah'] },
  { id:'MAT', num:40, aliases:['mateus','mateo','matteo','matthew','mt','mat'] },
  { id:'MRK', num:41, aliases:['marcos','marc','marco','mark','mc','mrk','mr'] },
  { id:'LUK', num:42, aliases:['lucas','luca','luke','lc','luk'] },
  { id:'JHN', num:43, aliases:['joão','joao','juan','giovanni','john','jo','jn','jhn'] },
  { id:'ACT', num:44, aliases:['atos','hechos','atti','acts','at','act'] },
  { id:'ROM', num:45, aliases:['romanos','romani','romans','rm','rom'] },
  { id:'1CO', num:46, aliases:['1corintios','1coríntios','1corinzi','1corinthians','1co','1cor'] },
  { id:'2CO', num:47, aliases:['2corintios','2coríntios','2corinzi','2corinthians','2co','2cor'] },
  { id:'GAL', num:48, aliases:['gálatas','galatas','galati','galatians','gl','gal'] },
  { id:'EPH', num:49, aliases:['efésios','efesios','efesini','ephesians','ef','eph'] },
  { id:'PHP', num:50, aliases:['filipenses','filippesi','philippians','fp','php','fil'] },
  { id:'COL', num:51, aliases:['colossenses','colosenses','colossesi','colossians','cl','col'] },
  { id:'1TH', num:52, aliases:['1tessalonicenses','1tesalonicenses','1tessalonicesi','1thessalonians','1ts','1th'] },
  { id:'2TH', num:53, aliases:['2tessalonicenses','2tesalonicenses','2thessalonians','2ts','2th'] },
  { id:'1TI', num:54, aliases:['1timóteo','1timoteo','1timothy','1tm','1ti'] },
  { id:'2TI', num:55, aliases:['2timóteo','2timoteo','2timothy','2tm','2ti'] },
  { id:'HEB', num:58, aliases:['hebreus','hebreos','ebrei','hebrews','hb','heb'] },
  { id:'JAS', num:59, aliases:['tiago','santiago','giacomo','james','tg','jas','jc'] },
  { id:'1PE', num:60, aliases:['1pedro','1pietro','1peter','1pe','1pt'] },
  { id:'2PE', num:61, aliases:['2pedro','2pietro','2peter','2pe','2pt'] },
  { id:'1JN', num:62, aliases:['1joão','1joao','1juan','1giovanni','1john','1jo','1jn'] },
  { id:'2JN', num:63, aliases:['2joão','2joao','2juan','2john','2jo','2jn'] },
  { id:'3JN', num:64, aliases:['3joão','3joao','3juan','3john','3jo','3jn'] },
  { id:'JUD', num:65, aliases:['judas','giuda','jude','jd','jud'] },
  { id:'REV', num:66, aliases:['apocalipse','apocalipsis','apocalisse','revelation','ap','rev'] },
];

// Livros do Novo Testamento para busca por palavras (mais rápido)
const LIVROS_NT = [
  { id:'MAT',num:40 },{ id:'MRK',num:41 },{ id:'LUK',num:42 },{ id:'JHN',num:43 },
  { id:'ACT',num:44 },{ id:'ROM',num:45 },{ id:'1CO',num:46 },{ id:'2CO',num:47 },
  { id:'GAL',num:48 },{ id:'EPH',num:49 },{ id:'PHP',num:50 },{ id:'COL',num:51 },
  { id:'1TH',num:52 },{ id:'2TH',num:53 },{ id:'1TI',num:54 },{ id:'2TI',num:55 },
  { id:'TIT',num:56 },{ id:'PHM',num:57 },{ id:'HEB',num:58 },{ id:'JAS',num:59 },
  { id:'1PE',num:60 },{ id:'2PE',num:61 },{ id:'1JN',num:62 },{ id:'JUD',num:65 },
  { id:'REV',num:66 },
];

// ── PARSER DE REFERÊNCIA ─────────────────────────────────────────
// Transforma "Jo 3,16" ou "John 3:16" em { id:'JHN', num:43, cap:3, ver:16 }
function parsearReferencia(texto) {
  // Remove acentos e converte para minúsculo para comparação
  const norm = t => t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  const textoNorm = norm(texto);

  // Extrai números do final: "3,16" ou "3:16" ou "3"
  const numMatch = textoNorm.match(/(\d+)[,:.](\d+)$|(\d+)$/);
  if (!numMatch) return null;

  const cap = parseInt(numMatch[1] || numMatch[3]);
  const ver = numMatch[2] ? parseInt(numMatch[2]) : null;

  // Remove os números para ficar só o nome do livro
  const nomeTexto = textoNorm.replace(/[\d,:.]+/g, '').trim();

  // Procura o livro pelo nome/abreviação
  for (const livro of LIVROS_MAP) {
    for (const alias of livro.aliases) {
      if (norm(alias) === nomeTexto || norm(alias).startsWith(nomeTexto) || nomeTexto.startsWith(norm(alias))) {
        return { id: livro.id, num: livro.num, cap, ver };
      }
    }
  }
  return null;
}

// ── BUSCA POR PALAVRA ─────────────────────────────────────────────
async function buscarPorPalavra(palavra, traducao, maxResultados = 15) {
  const resultados = [];
  const palavraNorm = palavra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Busca em paralelo nos livros do NT (limitado para performance)
  await Promise.allSettled(
    LIVROS_NT.map(async ({ id, num }) => {
      try {
        // Busca o livro inteiro (getbible retorna todos os capítulos)
        const url = `https://api.getbible.net/v2/${traducao}/${num}.json`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) return;
        const livroData = await r.json();

        // Percorre cada capítulo e versículo
        for (const capNum in livroData) {
          const capData = livroData[capNum];
          if (!capData?.verses) continue;
          for (const verData of Object.values(capData.verses)) {
            if (!verData?.text) continue;
            const textoNorm = verData.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (textoNorm.includes(palavraNorm)) {
              resultados.push({
                livro_id:  id,
                livro_num: num,
                livro:     livroData.book_name || id,
                cap:       parseInt(capNum),
                ver:       verData.verse,
                texto:     verData.text,
              });
              if (resultados.length >= maxResultados * 2) return; // para cedo
            }
          }
        }
      } catch (_) { /* ignora erros individuais de livros */ }
    })
  );

  return resultados.slice(0, maxResultados);
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { q = '', lang = 'pt', modo = 'referencia' } = req.query;

  if (!q.trim()) {
    return res.status(400).json({ sucesso: false, mensagem: 'Parâmetro "q" é obrigatório.' });
  }

  const traducao = TRADUCOES[lang] || 'kjv';

  // ── MODO REFERÊNCIA ──────────────────────────────────────────
  if (modo === 'referencia') {
    const ref = parsearReferencia(q);
    if (!ref) {
      return res.json({
        sucesso: false,
        mensagem: `Não consegui entender a referência "${q}". Tente: "Jo 3,16", "Gn 1,1" ou "Salmos 23".`
      });
    }

    try {
      const url = `https://api.getbible.net/v2/${traducao}/${ref.num}/${ref.cap}.json`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Livro não disponível nesta tradução (HTTP ${r.status})`);
      const data = await r.json();

      // Extrai versículos
      const versiculos = Array.isArray(data.verses)
        ? data.verses
        : Object.values(data.verses || {});

      // Filtra o versículo específico se foi fornecido (ex: "Jo 3,16" → vers 16)
      const resultado = ref.ver
        ? versiculos.filter(v => v.verse === ref.ver)
        : versiculos;

      if (resultado.length === 0) {
        return res.json({ sucesso: false, mensagem: `Versículo ${ref.ver} não encontrado em ${data.book_name} ${ref.cap}.` });
      }

      return res.json({
        sucesso: true,
        modo: 'referencia',
        livro_id:  ref.id,
        livro_num: ref.num,
        livro:     data.book_name || ref.id,
        cap:       ref.cap,
        ver_destaque: ref.ver || null,
        traducao,
        versiculos: versiculos.map(v => ({ num: v.verse, txt: v.text?.trim() || '' })),
        destaque:   ref.ver || null,
      });

    } catch (e) {
      return res.status(500).json({ sucesso: false, mensagem: e.message });
    }
  }

  // ── MODO PALAVRA ─────────────────────────────────────────────
  if (modo === 'palavra') {
    try {
      const resultados = await buscarPorPalavra(q, traducao);

      if (resultados.length === 0) {
        return res.json({
          sucesso: true,
          modo: 'palavra',
          resultados: [],
          mensagem: `Nenhum resultado encontrado para "${q}" no Novo Testamento.`
        });
      }

      return res.json({
        sucesso: true,
        modo:      'palavra',
        busca:     q,
        traducao,
        total:     resultados.length,
        resultados,
      });

    } catch (e) {
      return res.status(500).json({ sucesso: false, mensagem: e.message });
    }
  }

  res.status(400).json({ sucesso: false, mensagem: 'modo deve ser "referencia" ou "palavra"' });
};
