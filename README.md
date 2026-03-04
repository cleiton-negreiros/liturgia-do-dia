# ✝ Liturgia do Dia

Site que exibe a liturgia diária com scraping do site oficial.

---

## 📁 Estrutura do Projeto

```
liturgia-do-dia/
├── api/
│   ├── liturgia.js          ← Função serverless (Vercel) - faz o scraping
│   └── servidor-local.js    ← Servidor Express para testes locais
├── public/
│   └── index.html           ← Frontend do site
├── package.json
├── vercel.json              ← Configuração do Vercel
└── README.md
```

---

## 🚀 Como Rodar Localmente

### 1. Instale as dependências (só na primeira vez)
```bash
npm install
```

### 2. Inicie o servidor local
```bash
npm run dev
```

### 3. Abra no navegador
```
http://localhost:3000
```

### 4. Teste a API diretamente
```
http://localhost:3000/api/liturgia
http://localhost:3000/api/liturgia?data=2026-03-04
```

---

## ☁️ Como Publicar no Vercel

### 1. Instale o CLI do Vercel
```bash
npm install -g vercel
```

### 2. Faça login
```bash
vercel login
```

### 3. Publique (dentro da pasta do projeto)
```bash
vercel
```

Siga as perguntas na tela. Na primeira vez ele vai perguntar o nome do projeto.

### 4. Para publicar atualizações futuras
```bash
vercel --prod
```

---

## 🔧 Como Funciona

1. O **frontend** (`public/index.html`) faz uma chamada para `/api/liturgia?data=AAAA-MM-DD`
2. A **função serverless** (`api/liturgia.js`) acessa `liturgiadiaria.site` e faz scraping do HTML
3. O **cheerio** (biblioteca) extrai os textos estruturados
4. O resultado é enviado como JSON para o frontend exibir

---

## 🐛 Resolução de Problemas

| Problema | Solução |
|---|---|
| `npm: command not found` | Node.js não está instalado. Baixe em nodejs.org |
| `ECONNREFUSED` | Servidor não está rodando. Execute `npm run dev` |
| Liturgia não carrega | O site fonte pode estar fora do ar. Tente mais tarde |
| Layout quebrado | Limpe o cache do navegador (Ctrl+Shift+R) |
