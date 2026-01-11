import React, { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export const toast = {
    success: (message: string, duration?: number) => {
        if (globalAddToast) {
            globalAddToast({ message, type: 'success', duration });
        }
    },
    error: (message: string, duration?: number) => {
        if (globalAddToast) {
            globalAddToast({ message, type: 'error', duration });
        }
    },
    warning: (message: string, duration?: number) => {
        if (globalAddToast) {
            globalAddToast({ message, type: 'warning', duration });
        }
    },
    info: (message: string, duration?: number) => {
        if (globalAddToast) {
            globalAddToast({ message, type: 'info', duration });
        }
    },
};

const getToastIcon = (type: string) => {
    switch (type) {
        case 'success':
            return <CheckCircle size={20} />;
        case 'error':
            return <AlertCircle size={20} />;
        case 'warning':
            return <AlertTriangle size={20} />;
        case 'info':
            return <Info size={20} />;
        default:
            return <Info size={20} />;
    }
};

const getToastStyles = (type: string): string => {
    switch (type) {
        case 'success':
            return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
        case 'error':
            return 'bg-red-500/10 border-red-500/20 text-red-400';
        case 'warning':
            return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
        case 'info':
        default:
            return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        const duration = toast.duration || 3000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Register global addToast function
    React.useEffect(() => {
        globalAddToast = addToast;
        return () => {
            globalAddToast = null;
        };
    }, [addToast]);

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toastItem) => (
                    <motion.div
                        key={toastItem.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg flex items-start gap-3 border ${getToastStyles(toastItem.type)}`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getToastIcon(toastItem.type)}
                        </div>
                        <div className="flex-1 text-sm font-medium">{toastItem.message}</div>
                        <button
                            onClick={() => removeToast(toastItem.id)}
                            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default toast;
