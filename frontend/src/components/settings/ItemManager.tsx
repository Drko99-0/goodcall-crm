import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, CheckCircle2, XCircle, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Generic Types ---
interface MasterItem {
    id: string;
    name: string;
    code?: string;
    isActive?: boolean;
    isActiveStatus?: boolean; // For statuses
    color?: string; // For statuses
}

// --- Props ---
interface ItemManagerProps {
    title: string;
    queryKey: string;
    fetchFn: () => Promise<any[]>;
    createFn: (data: any) => Promise<any>;
    updateFn: (id: string, data: any) => Promise<any>;
    hasColor?: boolean;
    itemType?: 'company' | 'technology' | 'status';
}

const ItemManager: React.FC<ItemManagerProps> = ({
    title,
    queryKey,
    fetchFn,
    createFn,
    updateFn,
    hasColor = false,
    itemType = 'company'
}) => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
    const [formData, setFormData] = useState<any>({});

    const { data: items, isLoading } = useQuery({
        queryKey: [queryKey],
        queryFn: fetchFn
    });

    const createMutation = useMutation({
        mutationFn: createFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateFn(editingItem!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            closeModal();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', code: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            code: item.code || '',
            isActive: item.isActive ?? item.isActiveStatus,
            color: item.color || '#000000'
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const toggleStatus = (item: any) => {
        const id = item.id;
        const currentStatus = item.isActive ?? item.isActiveStatus;
        const fieldName = itemType === 'status' ? 'isActiveStatus' : 'isActive';
        updateFn(id, { [fieldName]: !currentStatus }).then(() => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <button
                    onClick={openCreate}
                    className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-brand-500/20"
                >
                    <Plus size={16} /> Agregar
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-slate-400">Cargando...</div>
            ) : (
                <div className="grid gap-3">
                    {items?.map((item: any) => (
                        <div key={item.id} className="glass p-4 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-10 rounded-full ${(item.isActive || item.isActiveStatus) ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        {item.name}
                                        {hasColor && item.color && (
                                            <span
                                                className="w-3 h-3 rounded-full inline-block"
                                                style={{ backgroundColor: item.color }}
                                            />
                                        )}
                                    </h3>
                                    {item.code && <p className="text-xs text-slate-400 font-mono">{item.code}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => toggleStatus(item)}
                                    className={`p-2 rounded-lg ${(item.isActive || item.isActiveStatus) ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}
                                    title={(item.isActive || item.isActiveStatus) ? 'Desactivar' : 'Activar'}
                                >
                                    {(item.isActive || item.isActiveStatus) ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                </button>
                                <button
                                    onClick={() => openEdit(item)}
                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                        >
                            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto">
                                <form onSubmit={handleSubmit}>
                                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-white">{editingItem ? 'Editar' : 'Crear'} {title}</h3>
                                        <button type="button" onClick={closeModal} className="text-slate-400 hover:text-white"><X size={20} /></button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Nombre</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-brand-500"
                                                value={formData.name || ''}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-slate-400">Código (Opcional)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-brand-500"
                                                value={formData.code || ''}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            />
                                        </div>
                                        {hasColor && (
                                            <div className="space-y-2">
                                                <label className="text-sm text-slate-400">Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        className="h-10 w-20 bg-transparent border-none cursor-pointer"
                                                        value={formData.color || '#000000'}
                                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-brand-500 uppercase"
                                                        value={formData.color || ''}
                                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:text-white font-medium">Cancelar</button>
                                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/20 font-medium flex items-center gap-2">
                                            {createMutation.isPending || updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Guardar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ItemManager;
