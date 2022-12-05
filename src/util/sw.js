const APP_CACHE = 'app-v'
const APP_CACHE_ASSETS = [
    './',
]
const MEDIA_CACHE = 'media'
const MEDIA_CACHE_ASSETS = [
    '/manifest.json',
    '/favicon.png',
    '/logo.png',
    '/app.png',
    'https://fonts.nuqayah.com/kitab-base.woff2?v3',
    'https://fonts.nuqayah.com/kitab-base-b.woff2?v3',
    'https://fonts.nuqayah.com/kitab-phrases.woff2?v3',
]

const deleteCaches = cmp => caches.keys().then(keys => Promise.all(keys.filter(cmp).map(n => caches.delete(n))))
const cache_fresh = async (cache, url) => cache.put(url, await fetch(`${url}${url.includes('?') ? '&' : '?'}__nc=${Date.now()}`))

async function fetch_and_cache(request, cache_name) {
    const response = await fetch(request.clone())
    // Check if we received a valid response
    if (!response || response.status !== 200 || response.type !== 'basic')
        return response

    (await caches.open(cache_name)).put(request, response.clone())
    return response
}

self.addEventListener('install', e => {
    e.waitUntil(Promise.all([
        deleteCaches(n => n !== APP_CACHE && n !== MEDIA_CACHE),
        caches.open(APP_CACHE).then(cache => Promise.all(APP_CACHE_ASSETS.map(url => cache_fresh(cache, url)))),
    ]))
    caches.open(MEDIA_CACHE).then(cache => cache.addAll(MEDIA_CACHE_ASSETS)),
    self.skipWaiting()
})
self.addEventListener('fetch', e => {
    let url = e.request.url.replace(location.origin, '')
    if (url === '/')
        url = './'
    if (![...APP_CACHE_ASSETS, ...MEDIA_CACHE_ASSETS].includes(url))
        return
    e.respondWith(caches.match(url).then(r => r || fetch(e.request)))
})
