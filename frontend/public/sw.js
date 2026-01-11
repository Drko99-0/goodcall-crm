/// <reference lib="webworker" />

const CACHE_NAME = 'goodcall-crm-v1';
const URLsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Core JS and CSS will be cached dynamically
];

const API_CACHE_PREFIX = 'goodcall-api-';

/**
 * Service Worker for GoodCall CRM PWA
 * Provides offline capability and caching for API calls
 */
const sw = self as unknown as ServiceWorkerGlobalScope;

// Install event - cache static assets
sw.addEventListener('install', (event: ExtendableEvent) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(URLsToCache);
        })
    );

    // Force the waiting service worker to become the active service worker
    sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event: ExtendableEvent) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches that don't match the current version
                    if (cacheName !== CACHE_NAME && !cacheName.startsWith(API_CACHE_PREFIX)) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    // Also clean up old API caches (keep only latest 5)
                    if (cacheName.startsWith(API_CACHE_PREFIX)) {
                        const cacheNumber = parseInt(cacheName.replace(API_CACHE_PREFIX, ''), 10);
                        const currentCacheNumber = 1; // Could track this dynamically
                        if (cacheNumber < currentCacheNumber - 5) {
                            return caches.delete(cacheName);
                        }
                    }
                    return Promise.resolve();
                })
            );
        })
    );

    // Take control of all pages immediately
    sw.clients.claim();
});

// Fetch event - network first for API, cache first for static assets
sw.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests - Network First with cache fallback
    if (url.pathname.startsWith('/api')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets - Cache First with network fallback
    event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests with Network First strategy
 * Useful for keeping data fresh while providing offline fallback
 */
async function handleApiRequest(request: Request): Promise<Response> {
    const cache = await caches.open(`${API_CACHE_PREFIX}${Date.now()}`);

    try {
        // Try network first
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            console.log('[SW] Serving API response from cache:', request.url);
            return cachedResponse;
        }

        // No cache available, return offline response
        console.log('[SW] No cache available for:', request.url);
        return new Response(
            JSON.stringify({
                error: 'Offline - No cached data available',
                offline: true,
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

/**
 * Handle static requests with Cache First strategy
 * Useful for assets that don't change often
 */
async function handleStaticRequest(request: Request): Promise<Response> {
    const cache = await caches.open(CACHE_NAME);

    // Try cache first
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Cache hit - return cached response
        return cachedResponse;
    }

    // Cache miss - fetch from network
    try {
        const networkResponse = await fetch(request);

        // Cache successful responses for navigation requests
        if (networkResponse.ok && request.mode === 'navigate') {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed and no cache
        console.log('[SW] Network failed for static request:', request.url);

        // For navigation requests, return offline page
        if (request.mode === 'navigate') {
            return caches.match('/index.html') || new Response('Offline', { status: 503 });
        }

        throw error;
    }
}

// Message event - handle messages from clients
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        sw.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls))
        );
    }

    // Clear all caches
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
            })
        );
    }
});

export type {};

declare global {
    interface ServiceWorkerGlobalScope {
        skipWaiting(): void;
        clients: Clients;
    }
}

interface FetchEvent extends Event {
    request: Request;
    respondWith(response: Promise<Response> | Response): void;
}

interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
}

interface ExtendableMessageEvent extends ExtendableEvent {
    data: any;
}
