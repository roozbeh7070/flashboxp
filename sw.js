const CACHE_NAME = 'lang-app-v7';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/storage.js',
    './js/utils.js',
    './js/quiz.js',
    './js/components/FolderCard.js',
    './js/components/WordCard.js',
    './font/Vazirmatn-Regular.ttf',
    './font/Vazirmatn-Bold.ttf',
    './doc/logo.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                ASSETS.map(url => cache.add(url).catch(err => console.log('Failed to cache:', url, err)))
            );
        })
    );
});

// Activate & Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Assets from Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => null);
        })
    );
});
