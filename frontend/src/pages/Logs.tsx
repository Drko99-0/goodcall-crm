import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    Search,
    Filter,
    Calendar,
    User as UserIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    ArrowLeftRight,
    ShieldAlert,
    Info,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import logsService, { AuditLog } from '../services/logs.service';
import usersService from '../services/users.service';

const Logs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data: logs, isLoading, isError } = useQuery({
        queryKey: ['audit-logs', page, searchTerm],
        queryFn: () => logsService.getAll({
            page,
            limit,
            // Podríamos añadir filtros de acción aquí
        })
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: usersService.getAll
    });

    const getActionIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('login') || a.includes('auth')) return <ShieldAlert className="text-indigo-400" size={18} />;
        if (a.includes('create')) return <CheckCircle2 className="text-emerald-400" size={18} />;
        if (a.includes('delete')) return <XCircle className="text-rose-400" size={18} />;
        if (a.includes('update') || a.includes('edit')) return <ArrowLeftRight className="text-amber-400" size={18} />;
        return <Info className="text-slate-400" size={18} />;
    };

    const formatAction = (action: string) => {
        return action
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Activity className="text-brand-500" />
                        Auditoría de Sistema
                    </h1>
                    <p className="text-slate-400 mt-1">Registro detallado de actividad y cambios en la plataforma</p>
                </div>
            </div>

            <div className="glass p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por usuario o acción..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl flex items-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all">
                        <Filter size={18} />
                        Filtrar Acciones
                    </button>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-slate-800">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center text-slate-400">
                        <div className="animate-spin mr-3 h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                        Cargando logs...
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-400">
                        Error al cargar los registros de auditoría.
                    </div>
                ) : !logs || logs.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                        <Activity size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium text-slate-400">No hay actividad registrada</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Acción</th>
                                    <th className="px-6 py-4">Detalles</th>
                                    <th className="px-6 py-4">Fecha / Hora</th>
                                    <th className="px-6 py-4">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {logs.map((log: AuditLog) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                                                    <UserIcon size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">
                                                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema'}
                                                    </span>
                                                    <span className="text-xs text-slate-500">@{log.user?.username || 'system'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.action)}
                                                <span className="text-sm font-semibold text-slate-300">
                                                    {formatAction(log.action)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-400 max-w-xs truncate" title={log.description || log.entityType}>
                                                {log.description || `${log.entityType} ${log.entityId ? `(#${log.entityId.slice(0, 8)})` : ''}`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-300">
                                                    {format(new Date(log.createdAt), 'dd/MM/yyyy')}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} />
                                                    {format(new Date(log.createdAt), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                            {log.ipAddress || '---'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/30">
                    <span className="text-sm text-slate-500">
                        Mostrando registros recientes
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center px-4 text-sm font-medium text-white bg-slate-800 rounded-lg">
                            {page}
                        </div>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!logs || logs.length < limit}
                            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-50 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Logs;
