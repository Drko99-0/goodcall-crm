import React from 'react';
import { Wifi, WifiOff, RefreshCw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/use-pwa.hook';

/**
 * OfflineBanner - Displays notification when app is offline
 * Also shows update banner when new version is available
 */
export const OfflineBanner: React.FC = () => {
    const { isOnline, hasUpdate, updateApp } = usePWA();
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        await updateApp();
        setIsUpdating(false);
    };

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <WifiOff size={20} className="flex-shrink-0" />
                        <span className="font-medium">
                            Sin conexión - Algunas funciones pueden no estar disponibles
                        </span>
                        <button
                            onClick={() => window.location.reload()}
                            className="ml-4 p-1 hover:bg-amber-600 rounded transition-colors"
                            title="Reintentar conexión"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </motion.div>
            )}

            {isOnline && hasUpdate && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-brand-500 text-white px-4 py-3 shadow-lg"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                        <Download size={20} className="flex-shrink-0" />
                        <span className="font-medium">
                            Nueva versión disponible
                        </span>
                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="ml-4 px-3 py-1 bg-white text-brand-600 rounded-lg font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUpdating ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                'Actualizar ahora'
                            )}
                        </button>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="ml-2 p-1 hover:bg-brand-600 rounded transition-colors"
                            title="Cerrar"
                        >
                            ×
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * ConnectionStatusBadge - Small badge showing connection status
 */
export const ConnectionStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { isOnline } = usePWA();

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isOnline
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
            } ${className}`}
        >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>
    );
};

/**
 * InstallPWAButton - Button to prompt PWA installation (when available)
 */
export const InstallPWAButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
    const [isInstalled, setIsInstalled] = React.useState(false);

    React.useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('PWA installation accepted');
        }

        setDeferredPrompt(null);
    };

    if (isInstalled || !deferredPrompt) {
        return null;
    }

    return (
        <button
            onClick={handleInstall}
            className={`px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all ${className}`}
        >
            <Download size={16} />
            <span>Instalar App</span>
        </button>
    );
};

export default OfflineBanner;
