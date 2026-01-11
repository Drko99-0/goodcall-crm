import { useState, useEffect, useCallback } from 'react';
import { pwaService } from '../services/pwa.service';

/**
 * PWA Hook - React hook for PWA functionality
 *
 * @example
 * ```tsx
 * const { isOnline, hasUpdate, updateApp } = usePWA();
 *
 * return (
 *   <div>
 *     {!isOnline && <OfflineBanner />}
 *     {hasUpdate && <UpdateButton onClick={updateApp} />}
 *   </div>
 * );
 * ```
 */
export interface UsePWAResult {
    /** Whether the app is currently online */
    isOnline: boolean;
    /** Whether there's a service worker update available */
    hasUpdate: boolean;
    /** Whether the PWA is installed (running as standalone) */
    isInstalled: boolean;
    /** Skip waiting and apply the update */
    updateApp: () => Promise<void>;
    /** Clear all caches */
    clearCache: () => Promise<void>;
}

export function usePWA(): UsePWAResult {
    const [isOnline, setIsOnline] = useState(() => pwaService.getIsOnline());
    const [hasUpdate, setHasUpdate] = useState(() => pwaService.hasUpdate());
    const [isInstalled, setIsInstalled] = useState(() => {
        return window.matchMedia('(display-mode: standalone)').matches;
    });

    useEffect(() => {
        // Register PWA service
        pwaService.register();

        // Subscribe to online/offline changes
        const unsubscribeOffline = pwaService.onOnlineChange((online) => {
            setIsOnline(online);
        });

        // Subscribe to update events
        const unsubscribeUpdate = pwaService.onUpdate(() => {
            setHasUpdate(true);
        });

        // Listen for display mode changes (install/uninstall)
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e: MediaQueryListEvent) => {
            setIsInstalled(e.matches);
        };

        mediaQuery.addEventListener('change', handleDisplayModeChange);

        return () => {
            unsubscribeOffline();
            unsubscribeUpdate();
            mediaQuery.removeEventListener('change', handleDisplayModeChange);
        };
    }, []);

    const updateApp = useCallback(async () => {
        await pwaService.skipWaiting();
        setHasUpdate(false);
    }, []);

    const clearCache = useCallback(async () => {
        await pwaService.clearCache();
    }, []);

    return {
        isOnline,
        hasUpdate,
        isInstalled,
        updateApp,
        clearCache,
    };
}

/**
 * Hook that only tracks online/offline status
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(() => pwaService.getIsOnline());

    useEffect(() => {
        const unsubscribe = pwaService.onOnlineChange((online) => {
            setIsOnline(online);
        });

        return unsubscribe;
    }, []);

    return isOnline;
}

/**
 * Hook that provides service worker update notification
 */
export function useServiceWorkerUpdate(): {
    hasUpdate: boolean;
    updateApp: () => Promise<void>;
} {
    const [hasUpdate, setHasUpdate] = useState(() => pwaService.hasUpdate());

    useEffect(() => {
        const unsubscribe = pwaService.onUpdate(() => {
            setHasUpdate(true);
        });

        return unsubscribe;
    }, []);

    const updateApp = useCallback(async () => {
        await pwaService.skipWaiting();
        setHasUpdate(false);
    }, []);

    return { hasUpdate, updateApp };
}

export default usePWA;
