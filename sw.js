const CACHE_NAME = 'm4fmclub-v1.0.2';
const DYNAMIC_CACHE = 'm4fmclub-dynamic-v1';
const API_CACHE = 'm4fmclub-api-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Instalação
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 M4FMCLUB Cache aberto');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => {
                    return key !== CACHE_NAME && 
                           key !== DYNAMIC_CACHE && 
                           key !== API_CACHE;
                })
                .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // API Radio Browser - Network First
    if (url.hostname.includes('radio-browser.info')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(API_CACHE)
                            .then(cache => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) return cachedResponse;
                            return new Response(
                                JSON.stringify({ error: 'Offline' }),
                                { headers: { 'Content-Type': 'application/json' } }
                            );
                        });
                })
        );
        return;
    }
    
    // Assets - Cache First
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;
                    
                    return fetch(event.request)
                        .then(response => {
                            if (!response || response.status !== 200) {
                                return response;
                            }
                            
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => cache.put(event.request, responseClone));
                            return response;
                        })
                        .catch(() => {
                            if (event.request.mode === 'navigate') {
                                return caches.match('/');
                            }
                        });
                })
        );
    }
});