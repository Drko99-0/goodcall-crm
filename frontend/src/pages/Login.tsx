import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import authService from '../services/auth.service';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(username, password, twoFactorCode);

            if (result.twoFactorRequired) {
                setStep('2fa');
            } else if (result.accessToken && result.user) {
                localStorage.setItem('accessToken', result.accessToken);
                localStorage.setItem('user', JSON.stringify(result.user));
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px] animate-pulse-soft" />
            <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse-soft" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass p-8 rounded-3xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 mb-4 shadow-xl shadow-brand-500/10">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        GoodCall CRM
                    </h1>
                    <p className="text-slate-400 mt-2">Bienvenido de nuevo</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-100 text-sm"
                    >
                        <AlertCircle size={18} className="text-red-500 shrink-0" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <AnimatePresence mode="wait">
                        {step === 'credentials' ? (
                            <motion.div
                                key="credentials"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Usuario</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-500 transition-colors">
                                            <User size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field pl-12"
                                            placeholder="Ingresa tu usuario"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-500 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type="password"
                                            className="input-field pl-12"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="2fa"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2 text-center mb-4">
                                    <div className="inline-flex p-3 bg-brand-500/10 rounded-xl text-brand-500 mb-2">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h2 className="text-xl font-semibold text-white">Verificación 2FA</h2>
                                    <p className="text-sm text-slate-400">Ingresa el código generado en tu app de autenticación</p>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>{step === 'credentials' ? 'Iniciar Sesión' : 'Verificar y Entrar'}</span>
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </>
                        )}
                    </button>

                    {step === '2fa' && (
                        <button
                            type="button"
                            onClick={() => setStep('credentials')}
                            className="w-full text-slate-400 text-sm hover:text-white transition-colors"
                        >
                            Volver al inicio de sesión
                        </button>
                    )}
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                        GoodCall System v1.0
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
