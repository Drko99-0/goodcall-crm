import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import companiesService from '../../services/companies.service';
import technologiesService from '../../services/technologies.service';
import saleStatusesService from '../../services/sale-statuses.service';
import usersService from '../../services/users.service';
import salesService from '../../services/sales.service';

// --- Schema Validation ---
const saleSchema = z.object({
    clientName: z.string().min(3, 'Nombre del cliente requerido (min 3 chars)'),
    clientDni: z.string().min(5, 'Documento requerido'),
    clientPhone: z.string().min(7, 'Teléfono requerido'),
    saleDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida'),
    companyId: z.string().min(1, 'Seleccione una compañía'),
    companySoldId: z.string().optional(),
    technologyId: z.string().optional(),
    saleStatusId: z.string().optional(),
    asesorId: z.string().min(1, 'Seleccione un asesor'),
    cerradorId: z.string().optional(),
    fidelizadorId: z.string().optional(),
    extraInfo: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SalesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    saleToEdit?: any; // Tipar mejor si es posible con la interfaz Sale
}

const SalesFormModal: React.FC<SalesFormModalProps> = ({ isOpen, onClose, saleToEdit }) => {
    const queryClient = useQueryClient();
    const [user] = React.useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const isEditMode = !!saleToEdit;

    // --- Data Fetching ---
    const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesService.getAll });
    const { data: technologies } = useQuery({ queryKey: ['technologies'], queryFn: technologiesService.getAll });
    const { data: statuses } = useQuery({ queryKey: ['statuses'], queryFn: saleStatusesService.getAll });
    const { data: allUsers } = useQuery({ queryKey: ['asesores'], queryFn: usersService.getAsesores, retry: false });

    // Filtrado de usuarios según su rol "ocupado"
    const asesores = allUsers?.filter(u => u.role === 'asesor');
    const cerradores = allUsers?.filter(u => u.role === 'cerrador');
    const fidelizadores = allUsers?.filter(u => u.role === 'fidelizador');

    // --- Form Setup ---
    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<SaleFormData>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            saleDate: new Date().toISOString().split('T')[0],
            companyId: '',
            companySoldId: '',
            technologyId: '',
            saleStatusId: '',
            clientName: '',
            clientDni: '',
            clientPhone: '',
            asesorId: user.role === 'asesor' ? user.id : '',
            cerradorId: '',
            fidelizadorId: '',
            extraInfo: ''
        }
    });

    const initializedRef = React.useRef(false);

    // Reset form when opening/editing
    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = false;
            return;
        }

        if (isOpen && !initializedRef.current) {
            initializedRef.current = true;
            if (saleToEdit) {
                reset({
                    ...saleToEdit,
                    saleDate: saleToEdit.saleDate ? new Date(saleToEdit.saleDate).toISOString().split('T')[0] : '',
                    companyId: saleToEdit.company?.id || saleToEdit.companyId || '',
                    companySoldId: saleToEdit.companySold?.id || saleToEdit.companySoldId || '',
                    technologyId: saleToEdit.technology?.id || saleToEdit.technologyId || '',
                    saleStatusId: saleToEdit.saleStatus?.id || saleToEdit.saleStatusId || '',
                    asesorId: saleToEdit.asesorId || '',
                    cerradorId: saleToEdit.cerradorId || '',
                    fidelizadorId: saleToEdit.fidelizadorId || '',
                    clientName: saleToEdit.clientName || '',
                    clientDni: saleToEdit.clientDni || '',
                    clientPhone: saleToEdit.clientPhone || '',
                    extraInfo: saleToEdit.extraInfo || '',
                });
            } else {
                reset({
                    saleDate: new Date().toISOString().split('T')[0],
                    asesorId: user.role === 'asesor' ? user.id : '',
                    companyId: '',
                    companySoldId: '',
                    technologyId: '',
                    saleStatusId: '',
                    clientName: '',
                    clientDni: '',
                    clientPhone: '',
                    cerradorId: '',
                    fidelizadorId: '',
                    extraInfo: ''
                });
            }
        }
    }, [isOpen, saleToEdit?.id, reset, user.id, user.role]);

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: salesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'list'] });
            onClose();
            reset();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => salesService.update(saleToEdit.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'list'] });
            onClose();
            reset();
        }
    });

    const onSubmit = (data: SaleFormData) => {
        // Limpiar campos de ID opcionales que vienen como string vacío para que el backend los acepte como null/undefined
        const cleanData = {
            ...data,
            companySoldId: data.companySoldId || null,
            technologyId: data.technologyId || null,
            saleStatusId: data.saleStatusId || null,
            cerradorId: data.cerradorId || null,
            fidelizadorId: data.fidelizadorId || null,
            // Aseguramos que la fecha sea un Date si el backend lo requiere, aunque como string suele funcionar con NestJS
        };

        if (isEditMode) {
            updateMutation.mutate(cleanData);
        } else {
            createMutation.mutate(cleanData);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                                <h2 className="text-xl font-bold text-white">
                                    {isEditMode ? 'Editar Venta' : 'Nueva Venta'}
                                </h2>
                                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 flex-1">

                                {/* Sección 1: Cliente */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">Información del Cliente</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Nombre Completo *</label>
                                            <Controller
                                                name="clientName"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" placeholder="Ej. Juan Pérez" />
                                                )}
                                            />
                                            {errors.clientName && <p className="text-red-400 text-xs">{errors.clientName.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">DNI / Documento *</label>
                                            <Controller
                                                name="clientDni"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" placeholder="Ej. 12345678" />
                                                )}
                                            />
                                            {errors.clientDni && <p className="text-red-400 text-xs">{errors.clientDni.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Teléfono *</label>
                                            <Controller
                                                name="clientPhone"
                                                control={control}
                                                render={({ field }) => (
                                                    <input {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" placeholder="Ej. 999888777" />
                                                )}
                                            />
                                            {errors.clientPhone && <p className="text-red-400 text-xs">{errors.clientPhone.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Fecha Venta *</label>
                                            <Controller
                                                name="saleDate"
                                                control={control}
                                                render={({ field }) => (
                                                    <input type="date" {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" />
                                                )}
                                            />
                                            {errors.saleDate && <p className="text-red-400 text-xs">{errors.saleDate.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 pt-4"></div>

                                {/* Sección 2: Operación */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">Detalles de la Venta</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Compañía *</label>
                                            <Controller
                                                name="companyId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500">
                                                        <option value="">Seleccione...</option>
                                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                )}
                                            />
                                            {errors.companyId && <p className="text-red-400 text-xs">{errors.companyId.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Compañía de Origen (Donde estaba)</label>
                                            <Controller
                                                name="companySoldId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500">
                                                        <option value="">Seleccione...</option>
                                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Tecnología</label>
                                            <Controller
                                                name="technologyId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select {...field} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500">
                                                        <option value="">N/A</option>
                                                        {technologies?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Estado</label>
                                            <Controller
                                                name="saleStatusId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select
                                                        {...field}
                                                        disabled={user.role === 'asesor' && isEditMode}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
                                                    >
                                                        <option value="">Pendiente</option>
                                                        {statuses?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                )}
                                            />
                                            {user.role === 'asesor' && isEditMode && <p className="text-[10px] text-slate-500 italic">No tienes permisos para cambiar el estado</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Asesor Asignado *</label>
                                            <Controller
                                                name="asesorId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select
                                                        {...field}
                                                        disabled={user.role === 'asesor'}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {asesores?.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.username})</option>)}
                                                    </select>
                                                )}
                                            />
                                            {errors.asesorId && <p className="text-red-400 text-xs">{errors.asesorId.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Cerrador</label>
                                            <Controller
                                                name="cerradorId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select
                                                        {...field}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                                    >
                                                        <option value="">N/A</option>
                                                        {cerradores?.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                                                    </select>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Fidelizador</label>
                                            <Controller
                                                name="fidelizadorId"
                                                control={control}
                                                render={({ field }) => (
                                                    <select
                                                        {...field}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                                    >
                                                        <option value="">N/A</option>
                                                        {fidelizadores?.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                                                    </select>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Observaciones</label>
                                        <Controller
                                            name="extraInfo"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea {...field} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 resize-none" placeholder="Detalles adicionales..." />
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900 rounded-b-2xl">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Guardar Venta
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SalesFormModal;
