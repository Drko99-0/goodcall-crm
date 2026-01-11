import React, { useState } from 'react';
import {
    Download,
    FileText,
    Calendar,
    ChevronDown,
    Filter,
    Table as TableIcon,
    PieChart as PieIcon,
    BarChart3
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import salesService from '../services/sales.service';
import companiesService from '../services/companies.service';
import saleStatusesService from '../services/sale-statuses.service';

const Reports: React.FC = () => {
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesService.getAll });
    const { data: statuses } = useQuery({ queryKey: ['statuses'], queryFn: saleStatusesService.getAll });

    const handleExport = () => {
        alert('Generando reporte CSV... (En un entorno real, esto dispararía una descarga del backend o generaría un CSV en el cliente)');
    };

    const reportTypes = [
        { id: 'sales', name: 'Resumen de Ventas', description: 'Detalle completo de operaciones por asesor y compañía.', icon: FileText },
        { id: 'performance', name: 'Desempeño de Asesores', description: 'Métricas de efectividad y cumplimiento de metas.', icon: BarChart3 },
        { id: 'companies', name: 'Análisis por Compañía', description: 'Distribución de ventas por operador y tecnología.', icon: PieIcon },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Reportes</h1>
                <p className="text-slate-400 mt-1">Genera y exporta informes detallados de operación</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="glass p-6 rounded-3xl border border-slate-800 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Filter className="text-brand-500" size={20} />
                        Configuración
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Rango de Fechas</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Compañía</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                                <option value="">Todas las compañías</option>
                                {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Estado de Venta</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                {statuses?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={handleExport}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-4"
                        >
                            <Download size={20} />
                            Generar y Exportar
                        </button>
                    </div>
                </div>

                {/* Report Options */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTypes.map((type) => (
                        <div key={type.id} className="glass p-6 rounded-3xl border border-slate-800 hover:border-brand-500/50 transition-all group cursor-pointer">
                            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500 w-fit mb-4 group-hover:scale-110 transition-transform">
                                <type.icon size={24} />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">{type.name}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-4">{type.description}</p>
                            <div className="flex items-center gap-2 text-brand-400 text-sm font-medium">
                                <span className="underline underline-offset-4">Seleccionar este reporte</span>
                                <ChevronDown size={14} className="-rotate-90" />
                            </div>
                        </div>
                    ))}

                    <div className="glass p-6 rounded-3xl border border-slate-800 border-dashed flex flex-col items-center justify-center text-center opacity-60">
                        <TableIcon size={32} className="text-slate-600 mb-3" />
                        <h4 className="text-md font-bold text-slate-500">Más reportes próximamente</h4>
                        <p className="text-xs text-slate-600">Estamos trabajando en nuevos indicadores</p>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="glass p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4">
                    <FileText size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-300">Vista Previa del Reporte</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    Configura los filtros y haz clic en "Generar" para ver una previsualización de los datos aquí.
                </p>
            </div>
        </div>
    );
};

export default Reports;
