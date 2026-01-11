import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, Lock, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

const profileSchema = z.object({
    firstName: z.string().min(2, 'El nombre es muy corto'),
    lastName: z.string().min(2, 'El apellido es muy corto'),
    password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            password: '',
            confirmPassword: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                password: '',
                confirmPassword: '',
            });
            setSuccess(false);
            setError(null);
        }
    }, [isOpen, reset, user.firstName, user.lastName]);

    const onSubmit = async (data: ProfileFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const updateData: any = {
                firstName: data.firstName,
                lastName: data.lastName,
            };
            if (data.password) {
                updateData.password = data.password;
            }

            const response = await api.patch('/users/me', updateData);

            // Actualizar local storage
            const updatedUser = { ...user, firstName: data.firstName, lastName: data.lastName };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500">
                                    <User size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Mi Perfil</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm">
                                    ¡Perfil actualizado correctamente!
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
                                    <input
                                        {...register('firstName')}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        placeholder="Tu nombre"
                                    />
                                    {errors.firstName && <p className="text-[10px] text-red-500 ml-1">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Apellido</label>
                                    <input
                                        {...register('lastName')}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        placeholder="Tu apellido"
                                    />
                                    {errors.lastName && <p className="text-[10px] text-red-500 ml-1">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 space-y-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Lock size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Cambiar Contraseña</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        placeholder="••••••••"
                                    />
                                    {errors.password && <p className="text-[10px] text-red-500 ml-1">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        {...register('confirmPassword')}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                        placeholder="••••••••"
                                    />
                                    {errors.confirmPassword && <p className="text-[10px] text-red-500 ml-1">{errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Save size={20} />
                                )}
                                Guardar Cambios
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
