// api/missa-multilang.js
// Proxy para feed.evangelizo.org — retorna leituras da Missa em ES, IT ou EN
// PT usa a api liturgia.up.railway.app (já existente em api/liturgia.js)
// Parâmetros: ?data=AAAA-MM-DD&lang=es|it|en

const LANG_MAP = {
  es: 'SP',   // Espanhol
  it: 'IT',   // Italiano
  en: 'AM',   // Inglês (American)
};

const LABEL = {
  es: { fr:'Primera Lectura', ps:'Salmo Responsorial', sr:'Segunda Lectura', gsp:'Evangelio' },
  it: { fr:'Prima Lettura',   ps:'Salmo Responsoriale', sr:'Seconda Lettura', gsp:'Vangelo'  },
  en: { fr:'First Reading',   ps:'Responsorial Psalm',  sr:'Second Reading',  gsp:'Gospel'   },
};

async function fetchEvang(date8, type, lang, content = '') {
  const params = new URLSearchParams({ date: date8, type, lang });
  if (content) params.set('content', content);
  const url = `https://feed.evangelizo.org/v2/reader.php?${params}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`evangelizo ${type}/${content} → HTTP ${r.status}`);
  const txt = (await r.text()).trim();
  return txt;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { data, lang = 'en' } = req.query;

  const evangLang = LANG_MAP[lang];
  if (!evangLang) return res.status(400).json({ sucesso: false, mensagem: `Idioma "${lang}" não suportado. Use es, it ou en.` });

  // Converte AAAA-MM-DD → AAAAMMDD
  const data8 = (data || new Date().toISOString().slice(0,10)).replace(/-/g, '');
  const lbl   = LABEL[lang];

  try {
    // Busca todas as partes em paralelo
    const [liturgicT, saint,
           fr_lt, fr_txt,
           ps_lt, ps_txt,
           sr_lt, sr_txt,
           gsp_lt, gsp_txt] = await Promise.all([
      fetchEvang(data8, 'liturgic_t', evangLang),
      fetchEvang(data8, 'saint',      evangLang),
      fetchEvang(data8, 'reading_lt', evangLang, 'FR'),
      fetchEvang(data8, 'reading',    evangLang, 'FR'),
      fetchEvang(data8, 'reading_lt', evangLang, 'PS'),
      fetchEvang(data8, 'reading',    evangLang, 'PS'),
      fetchEvang(data8, 'reading_lt', evangLang, 'SR'),
      fetchEvang(data8, 'reading',    evangLang, 'SR'),
      fetchEvang(data8, 'reading_lt', evangLang, 'GSP'),
      fetchEvang(data8, 'reading',    evangLang, 'GSP'),
    ]);

    const leituras = [];

    if (fr_txt && fr_txt.length > 5) {
      leituras.push({ tipo: lbl.fr, titulo: fr_lt, texto: fr_txt });
    }
    if (ps_txt && ps_txt.length > 5) {
      leituras.push({ tipo: lbl.ps, titulo: ps_lt, texto: ps_txt });
    }
    // Segunda leitura só aparece aos domingos/festas — ignora se vazio
    if (sr_txt && sr_txt.length > 5 && sr_txt !== fr_txt) {
      leituras.push({ tipo: lbl.sr, titulo: sr_lt, texto: sr_txt });
    }
    if (gsp_txt && gsp_txt.length > 5) {
      leituras.push({ tipo: lbl.gsp, titulo: gsp_lt, texto: gsp_txt });
    }

    if (leituras.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Nenhuma leitura encontrada. A data pode estar fora do intervalo (máx. 30 dias).' });
    }

    res.json({
      sucesso: true,
      data: data || new Date().toISOString().slice(0, 10),
      lang,
      liturgia: liturgicT,
      santo: saint,
      leituras,
      fonte: 'evangelizo.org',
    });

  } catch (e) {
    res.status(500).json({ sucesso: false, mensagem: e.message });
  }
};
