import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import salesService, { Sale } from '../services/sales.service';
import { format } from 'date-fns';
import {
    Search,
    Filter,
    Download,
    Plus,
    Edit2,
    Trash2,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    ChevronDown,
    X
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import SalesFormModal from '../components/modals/SalesFormModal';
import companiesService from '../services/companies.service';
import saleStatusesService from '../services/sale-statuses.service';
import usersService from '../services/users.service';

const SalesList: React.FC = () => {
    const queryClient = useQueryClient();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saleToEdit, setSaleToEdit] = useState<Sale | undefined>(undefined);
    const [showFilters, setShowFilters] = useState(false);

    // Filtros avanzados
    const [filters, setFilters] = useState({
        statusId: '',
        companyId: '',
        asesorId: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10
    });

    const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesService.getAll });
    const { data: statuses } = useQuery({ queryKey: ['statuses'], queryFn: saleStatusesService.getAll });
    const { data: asesores } = useQuery({ queryKey: ['asesores'], queryFn: usersService.getAsesores });

    const deleteMutation = useMutation({
        mutationFn: salesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'list'] });
        },
        onError: () => {
            alert('Error al eliminar la venta');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => salesService.update(id, { saleStatusId: '6b6b6b6b-6b6b-6b6b-6b6b-6b6b6b6b6b6b' }), // ID de CANC, idealmente dinámico
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'list'] });
        },
        onError: () => {
            alert('Error al cancelar la venta');
        }
    });

    const handleDeleteSale = (id: string) => {
        if (window.confirm('¿Confirma eliminar definitivamente esta venta?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCancelSale = (id: string) => {
        if (window.confirm('¿Confirma cancelar esta venta?')) {
            // Nota: Aquí necesitaríamos el ID correcto del estado CANC o una lógica robusta
            cancelMutation.mutate(id);
        }
    };

    const handleNewSale = () => {
        setSaleToEdit(undefined);
        setIsModalOpen(true);
    };

    const handleEditSale = (sale: Sale) => {
        setSaleToEdit(sale);
        setIsModalOpen(true);
    };

    // Obtener filtros iniciales
    const now = new Date();
    // const startDate = startOfMonth(now).toISOString(); 
    // const endDate = endOfMonth(now).toISOString();

    const { data: sales, isLoading, isError } = useQuery({
        queryKey: ['sales', 'list', filters],
        queryFn: () => salesService.getAll({
            // Si es admin/developer puede ver todo, si no filtrar por su ID
            asesorId: filters.asesorId || (['developer', 'gerencia', 'coordinador'].includes(user.role) ? undefined : user.id),
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            // Nota: El backend debe soportar statusId y companyId en el filtro si queremos que sea 100% server-side
        })
    });

    // Filtrado local para status y company si el backend no los soporta aún en el getAll base
    const filteredSales = (Array.isArray(sales) ? sales : (sales as any)?.data || [])?.filter((sale: Sale) => {
        const matchesSearch = sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.clientDni?.includes(searchTerm) ||
            sale.id.includes(searchTerm);

        const matchesStatus = !filters.statusId || sale.saleStatusId === filters.statusId;
        const matchesCompany = !filters.companyId || sale.companyId === filters.companyId;

        return matchesSearch && matchesStatus && matchesCompany;
    }) || [];

    const getStatusBadge = (status?: { name: string, color: string }) => {
        if (!status) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">Sin estado</span>;

        return (
            <span
                className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"
                style={{ backgroundColor: status.color + '20', color: status.color }}
            >
                {status.color === '#008000' && <CheckCircle2 size={12} />}
                {status.color === '#FF0000' && <XCircle size={12} />}
                {status.color === '#FFA500' && <Clock size={12} />}
                {status.name}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <SalesFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                saleToEdit={saleToEdit}
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Ventas</h1>
                    <p className="text-slate-400 mt-1">Gestión y seguimiento de operaciones comerciales</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-2 transition-all border border-slate-700">
                        <Download size={18} />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button
                        onClick={handleNewSale}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                    >
                        <Plus size={18} />
                        <span>Nueva Venta</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="glass p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, DNI o ID..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'bg-brand-500/10 border-brand-500 text-brand-500' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        <Filter size={18} />
                        Filtros
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    {(filters.statusId || filters.companyId || filters.asesorId || filters.startDate || filters.endDate) && (
                        <button
                            onClick={() => setFilters({ ...filters, statusId: '', companyId: '', asesorId: '', startDate: '', endDate: '', page: 1 })}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
                            title="Limpiar filtros"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass p-6 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Estado</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                    value={filters.statusId}
                                    onChange={(e) => setFilters({ ...filters, statusId: e.target.value })}
                                >
                                    <option value="">Todos los estados</option>
                                    {statuses?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Compañía</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                    value={filters.companyId}
                                    onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                                >
                                    <option value="">Todas las compañías</option>
                                    {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha Desde</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha Hasta</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden border border-slate-800">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center text-slate-400">
                        <div className="animate-spin mr-3 h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                        Cargando ventas...
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-red-400">
                        Error al cargar las ventas. Por favor intenta de nuevo.
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium text-slate-400">No se encontraron ventas</p>
                        <p className="text-sm">Prueba ajustando los filtros o crea una nueva venta.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4">ID / Fecha</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Producto / Compañía</th>
                                    <th className="px-6 py-4">Asesor</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredSales.map((sale: Sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono text-slate-500 mb-1">#{sale.id.slice(0, 8)}</span>
                                                <span className="text-sm text-slate-300 font-medium">
                                                    {format(new Date(sale.saleDate), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{sale.clientName}</span>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <span>{sale.clientDni}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {sale.company && (
                                                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                                                        {sale.company.code || sale.company.name}
                                                    </span>
                                                )}
                                                {/* Aquí podríamos mostrar iconos de productos si los tuviéramos */}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {sale.asesor ? (
                                                <span>{sale.asesor.firstName} {sale.asesor.lastName}</span>
                                            ) : (
                                                <span>Asesor #{sale.asesorId?.slice(0, 5)}...</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(sale.saleStatus)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleCancelSale(sale.id)}
                                                    className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                    title="Cancelar Venta"
                                                    disabled={sale.saleStatus?.code === 'CANC'}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSale(sale)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSale(sale.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Eliminar Permanente"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm bg-slate-900/30">
                    <span className="text-slate-500">Mostrando {filteredSales.length} resultados</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                            disabled={filters.page === 1}
                            className="px-3 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Anterior
                        </button>
                        <div className="flex items-center px-4 font-medium text-white bg-slate-800 rounded-lg">
                            Página {filters.page}
                        </div>
                        <button
                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            disabled={filteredSales.length < filters.limit}
                            className="px-3 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesList;
