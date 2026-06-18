const CACHE_NAME = 'lang-app-v27';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './font/Vazirmatn-Regular.ttf',
    './font/Vazirmatn-Bold.ttf',
    './doc/logo.png',
    './doc/icon.png',
    './data/b1-oxford.json',
    './data/b2-oxford.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2'
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
    const isLocal = url.origin === self.location.origin;
    const isFontAwesome = url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('font-awesome');
    
    if (!isLocal && !isFontAwesome) return;

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

// Listen for Push Notifications
self.addEventListener('push', (event) => {
    let data = { title: 'یادآوری جعبه لایتنر', body: 'وقت مرور فلش‌کارت‌های جدید است!' };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'یادآوری جعبه لایتنر', body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: './doc/logo.png',
        badge: './doc/icon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || './'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const targetUrl = event.notification.data?.url || './';
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then((focusedClient) => {
                        if (focusedClient && 'navigate' in focusedClient) {
                            return focusedClient.navigate(targetUrl);
                        }
                    });
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

