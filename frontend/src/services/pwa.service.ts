/**
 * PWA Service - Service Worker Management and Offline Detection
 *
 * Handles service worker registration, updates, and provides utilities
 * for detecting online/offline status in the application.
 */

interface ServiceWorkerUpdate {
    waiting: boolean;
    updating: boolean;
    registration: ServiceWorkerRegistration | null;
}

type UpdateCallback = (registration: ServiceWorkerRegistration) => void;
type OfflineCallback = (isOnline: boolean) => void;

class PWAService {
    private registration: ServiceWorkerRegistration | null = null;
    private updateCallbacks: Set<UpdateCallback> = new Set();
    private offlineCallbacks: Set<OfflineCallback> = new Set();
    private isOnline: boolean = navigator.onLine;

    constructor() {
        this.initOfflineListeners();
    }

    /**
     * Register the service worker
     */
    async register(): Promise<ServiceWorkerRegistration | null> {
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service workers are not supported in this browser');
            return null;
        }

        try {
            // Vite PWA plugin automatically registers the SW during build
            // But we can also manually check for updates
            const registration = await navigator.serviceWorker.getRegistration();

            if (registration) {
                this.registration = registration;
                this.listenForUpdates(registration);
                console.log('[PWA] Service worker registered:', registration);
                return registration;
            }

            return null;
        } catch (error) {
            console.error('[PWA] Service worker registration failed:', error);
            return null;
        }
    }

    /**
     * Listen for service worker updates
     */
    private listenForUpdates(registration: ServiceWorkerRegistration): void {
        // Check for updates every hour
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000);

        // Listen for the controlling service worker changing
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] New service worker is now controlling the page');
            window.location.reload();
        });

        // Listen for waiting service worker
        if (registration.waiting) {
            this.notifyUpdateCallbacks(registration);
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && registration.waiting) {
                        this.notifyUpdateCallbacks(registration);
                    }
                });
            }
        });
    }

    /**
     * Skip waiting and activate the new service worker immediately
     */
    async skipWaiting(): Promise<void> {
        if (!this.registration || !this.registration.waiting) {
            console.warn('[PWA] No waiting service worker to skip');
            return;
        }

        // Send message to waiting service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Listen for controller change
        return new Promise((resolve) => {
            const handler = () => {
                navigator.serviceWorker.removeEventListener('controllerchange', handler);
                resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', handler);
        });
    }

    /**
     * Subscribe to service worker updates
     */
    onUpdate(callback: UpdateCallback): () => void {
        this.updateCallbacks.add(callback);

        // If there's already a waiting SW, notify immediately
        if (this.registration?.waiting) {
            callback(this.registration);
        }

        // Return unsubscribe function
        return () => {
            this.updateCallbacks.delete(callback);
        };
    }

    /**
     * Notify all update callbacks
     */
    private notifyUpdateCallbacks(registration: ServiceWorkerRegistration): void {
        this.updateCallbacks.forEach((callback) => {
            try {
                callback(registration);
            } catch (error) {
                console.error('[PWA] Error in update callback:', error);
            }
        });
    }

    /**
     * Initialize offline event listeners
     */
    private initOfflineListeners(): void {
        const handleOnline = () => {
            this.isOnline = true;
            this.notifyOfflineCallbacks(true);
            console.log('[PWA] Connection restored');
        };

        const handleOffline = () => {
            this.isOnline = false;
            this.notifyOfflineCallbacks(false);
            console.log('[PWA] Connection lost');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
    }

    /**
     * Subscribe to online/offline changes
     */
    onOnlineChange(callback: OfflineCallback): () => void {
        this.offlineCallbacks.add(callback);

        // Call immediately with current status
        callback(this.isOnline);

        // Return unsubscribe function
        return () => {
            this.offlineCallbacks.delete(callback);
        };
    }

    /**
     * Notify all offline callbacks
     */
    private notifyOfflineCallbacks(isOnline: boolean): void {
        this.offlineCallbacks.forEach((callback) => {
            try {
                callback(isOnline);
            } catch (error) {
                console.error('[PWA] Error in offline callback:', error);
            }
        });
    }

    /**
     * Check if the app is currently online
     */
    getIsOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Get current service worker registration
     */
    getRegistration(): ServiceWorkerRegistration | null {
        return this.registration;
    }

    /**
     * Check if there's a waiting service worker (update available)
     */
    hasUpdate(): boolean {
        return !!this.registration?.waiting;
    }

    /**
     * Clear all caches
     */
    async clearCache(): Promise<void> {
        if (!this.registration) {
            return;
        }

        // Send message to service worker to clear cache
        this.registration.active?.postMessage({ type: 'CLEAR_CACHE' });

        // Also clear all caches manually
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        console.log('[PWA] All caches cleared');
    }

    /**
     * Get information about cached data
     */
    async getCacheInfo(): Promise<{ name: string; size: number }[]> {
        const cacheNames = await caches.keys();
        const info = await Promise.all(
            cacheNames.map(async (name) => {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                return {
                    name,
                    size: keys.length,
                };
            })
        );

        return info;
    }
}

// Export singleton instance
export const pwaService = new PWAService();

// Export class for testing
export { PWAService };

export default pwaService;
