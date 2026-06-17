const CACHE_NAME = 'lang-app-v15';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './font/Vazirmatn-Regular.ttf',
    './font/Vazirmatn-Bold.ttf',
    './doc/logo.png',
    './doc/icon.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                ASSETS.map(async (url) => {
                    try {
                        // Force network fetch to bypass browser HTTP cache
                        const response = await fetch(new Request(url, { cache: 'reload' }));
                        if (response.ok) {
                            await cache.put(url, response);
                        } else {
                            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
                        }
                    } catch (err) {
                        console.log('Failed to cache:', url, err);
                    }
                })
            );
        })
    );
});

// Activate & Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                );
            }),
            self.clients.claim()
        ])
    );
});

// Fetch Assets from Cache
self.addEventListener('fetch', (event) => {
    // Only intercept local GET requests to prevent Supabase or other external API interference
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // Bypass service worker cache for local development to ensure updates are reflected instantly
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        return;
    }

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});

// Skip waiting triggered from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
