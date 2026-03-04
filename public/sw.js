// sw.js — Service Worker da Liturgia do Dia
// ─────────────────────────────────────────────
// Estratégia:
//   - Shell do app (HTML, fontes): Cache first → sempre rápido
//   - API de liturgia: Network first → sempre atualizado, fallback no cache

const CACHE_SHELL   = 'liturgia-shell-v1';
const CACHE_DADOS   = 'liturgia-dados-v1';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Cinzel:wght@400;600&family=Lato:wght@300;400&display=swap'
];

// ── Instalação: pré-cacheia o shell ───────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then(cache => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Ativação: limpa caches antigos ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_SHELL && k !== CACHE_DADOS)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: intercepta requisições ─────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Requisições da API → Network First (dados sempre frescos)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE_DADOS));
    return;
  }

  // Shell e assets → Cache First (carregamento instantâneo)
  event.respondWith(cacheFirst(request, CACHE_SHELL));
});

// ── Estratégia: Network First ─────────────────────────────────
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Sem internet: tenta retornar do cache
    const cached = await cache.match(request);
    if (cached) return cached;

    // Se não tiver cache, retorna resposta de erro amigável
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: 'Você está sem conexão. A liturgia deste dia não está em cache.',
        offline: true
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Estratégia: Cache First ───────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Fallback final: página offline
    return caches.match('/index.html');
  }
}

// ── Push Notifications (preparado para o futuro) ──────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title   = data.title   || '✝ Liturgia do Dia';
  const options = {
    body:  data.body  || 'A Palavra de Deus te espera.',
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data:  { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'abrir', title: 'Ver leituras' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
