import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import usersService, { User } from '../../services/users.service';

const userSchema = z.object({
    firstName: z.string().min(2, 'Nombre requerido'),
    lastName: z.string().min(2, 'Apellido requerido'),
    email: z.string().email('Email inválido'),
    username: z.string().min(4, 'Usuario debe tener al menos 4 caracteres'),
    role: z.string().min(1, 'Rol requerido'),
    password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
    coordinatorId: z.string().optional(),
    isActive: z.boolean().optional(),
}).refine((data) => {
    // Si es creación (no hay id en el contexto, pero aquí validamos campos), password es obligatorio.
    // Esto lo manejaremos mejor en la lógica del componente validando si es 'create' vs 'edit'
    return true;
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: User;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, userToEdit }) => {
    const queryClient = useQueryClient();
    const isEditMode = !!userToEdit;
    const [showPassword, setShowPassword] = useState(false);

    // Obtener coordinadores para el selector (usuarios con rol coordinador solamente)
    const { data: potentialCoordinators } = useQuery({
        queryKey: ['users', 'coordinators'],
        queryFn: async () => {
            const all = await usersService.getAll();
            if (!Array.isArray(all)) return [];
            return all.filter(u => u.role?.toLowerCase() === 'coordinador');
        }
    });

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            isActive: true,
            role: 'asesor'
        }
    });

    const selectedRole = watch('role');
    const initializedRef = React.useRef(false);

    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = false;
            return;
        }

        if (isOpen && !initializedRef.current) {
            initializedRef.current = true;
            if (userToEdit) {
                reset({
                    firstName: userToEdit.firstName,
                    lastName: userToEdit.lastName,
                    email: userToEdit.email,
                    username: userToEdit.username,
                    role: userToEdit.role,
                    coordinatorId: userToEdit.coordinatorId || '',
                    isActive: userToEdit.isActive,
                    password: '',
                });
            } else {
                reset({
                    firstName: '',
                    lastName: '',
                    email: '',
                    username: '',
                    role: 'asesor',
                    password: '',
                    coordinatorId: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, userToEdit?.id, reset]);

    const mutation = useMutation({
        mutationFn: (payload: any) => {
            if (isEditMode && userToEdit) {
                return usersService.update(userToEdit.id, payload);
            } else {
                return usersService.create(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
            onClose();
        }
    });

    const onSubmit = (data: UserFormData) => {
        if (isEditMode) {
            // Sanitizar para UpdateUserDto
            const updatePayload: any = {
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                isActive: data.isActive,
                coordinatorId: data.coordinatorId || undefined
            };
            if (data.password) updatePayload.password = data.password;
            mutation.mutate(updatePayload);
        } else {
            // Validación manual para password
            if (!data.password) {
                alert("La contraseña es obligatoria para nuevos usuarios");
                return;
            }

            // Sanitizar para CreateUserDto
            const createPayload = {
                username: data.username,
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                coordinatorId: data.coordinatorId || undefined,
            };
            mutation.mutate(createPayload);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white">
                                    {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h2>
                                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Nombre *</label>
                                        <Controller name="firstName" control={control} render={({ field }) => (
                                            <input {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" />
                                        )} />
                                        {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Apellido *</label>
                                        <Controller name="lastName" control={control} render={({ field }) => (
                                            <input {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" />
                                        )} />
                                        {errors.lastName && <p className="text-red-400 text-xs">{errors.lastName.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Email *</label>
                                    <Controller name="email" control={control} render={({ field }) => (
                                        <input {...field} type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" />
                                    )} />
                                    {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Usuario *</label>
                                        <Controller name="username" control={control} render={({ field }) => (
                                            <input {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" />
                                        )} />
                                        {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Rol *</label>
                                        <Controller name="role" control={control} render={({ field }) => (
                                            <select {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500">
                                                <option value="asesor">Asesor</option>
                                                <option value="cerrador">Cerrador</option>
                                                <option value="fidelizador">Fidelizador</option>
                                                <option value="coordinador">Coordinador</option>
                                                <option value="gerencia">Gerencia</option>
                                                <option value="developer">Developer</option>
                                            </select>
                                        )} />
                                    </div>
                                </div>

                                {selectedRole === 'asesor' && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Coordinador Asignado</label>
                                        <Controller name="coordinatorId" control={control} render={({ field }) => (
                                            <select {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500">
                                                <option value="">Sin asignar</option>
                                                {potentialCoordinators?.map(c => (
                                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                                ))}
                                            </select>
                                        )} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">
                                        {isEditMode ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                                    </label>
                                    <div className="relative">
                                        <Controller name="password" control={control} render={({ field }) => (
                                            <input
                                                {...field}
                                                type={showPassword ? "text" : "password"}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 pr-10"
                                            />
                                        )} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
                                </div>

                                {isEditMode && (
                                    <div className="pt-2 flex items-center gap-2">
                                        <Controller name="isActive" control={control} render={({ field: { value, onChange } }) => (
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={onChange}
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                                            />
                                        )} />
                                        <label className="text-sm text-slate-300">Usuario Activo</label>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserFormModal;
