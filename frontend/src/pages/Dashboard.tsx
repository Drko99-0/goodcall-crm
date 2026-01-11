import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    Plus,
    Calendar,
    Target,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import salesService from '../services/sales.service';
import goalsService from '../services/goals.service';
import saleStatusesService from '../services/sale-statuses.service';
import SalesFormModal from '../components/modals/SalesFormModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { websocketService } from '../services/websocket.service';

const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [realtimeUpdate, setRealtimeUpdate] = useState<Date | null>(null);
    const now = new Date();
    const startDate = startOfMonth(now).toISOString();
    const endDate = endOfMonth(now).toISOString();

    const { data: sales, isLoading: loadingSales } = useQuery({
        queryKey: ['sales', 'dashboard', user.id],
        queryFn: () => salesService.getAll({
            asesorId: user.role === 'asesor' ? user.id : undefined, // Si es admin, quizás quiera ver todo? Por ahora filtremos por el usuario si es asesor
            startDate,
            endDate
        })
    });

    const { data: goals, isLoading: loadingGoals } = useQuery({
        queryKey: ['goals', 'dashboard', user.id],
        queryFn: () => goalsService.getAll({
            userId: user.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1 // 0-indexed en JS
        })
    });

    const totalSales = sales?.length || 0;
    const activeSales = sales?.filter((s: any) => s.saleStatus?.code !== 'CANC').length || 0;
    const currentGoal = goals?.[0]?.targetSales || 0;
    const goalProgress = currentGoal > 0 ? Math.min(Math.round((activeSales / currentGoal) * 100), 100) : 0;

    // --- WebSocket para actualizaciones en tiempo real ---
    useEffect(() => {
        // Conectar al WebSocket
        websocketService.connect().catch(console.error);

        // Escuchar actualizaciones de ventas
        const handleSaleUpdate = (data: any) => {
            if (data.event === 'sale_update') {
                console.log('Actualización en tiempo real:', data);
                setRealtimeUpdate(new Date());
                // Invalidar y refrescar queries
                queryClient.invalidateQueries({ queryKey: ['sales'] });
            }
        };

        // Escuchar actualizaciones de metas
        const handleGoalUpdate = (data: any) => {
            if (data.event === 'goal_update') {
                console.log('Meta actualizada:', data);
                setRealtimeUpdate(new Date());
                queryClient.invalidateQueries({ queryKey: ['goals'] });
            }
        };

        websocketService.on('sale_update', handleSaleUpdate);
        websocketService.on('goal_update', handleGoalUpdate);

        // Cleanup al desmontar
        return () => {
            websocketService.off('sale_update', handleSaleUpdate);
            websocketService.off('goal_update', handleGoalUpdate);
        };
    }, [queryClient]);

    // --- Data Processing for Charts ---
    const { data: statuses } = useQuery({ queryKey: ['statuses'], queryFn: saleStatusesService.getAll });

    const daysInMonth = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

    const salesByDayData = daysInMonth.map(day => {
        const daySales = sales?.filter((s: any) => isSameDay(new Date(s.saleDate), day)) || [];
        return {
            name: format(day, 'dd'),
            date: format(day, 'dd/MM'),
            total: daySales.length,
            active: daySales.filter((s: any) => s.saleStatus?.code !== 'CANC').length
        };
    });

    const salesByStatusData = statuses?.map((status: any) => ({
        name: status.name,
        value: sales?.filter((s: any) => s.saleStatusId === status.id).length || 0,
        color: status.color
    })).filter((s: any) => s.value > 0) || [];

    const stats = [
        { label: 'Ventas Totales', value: loadingSales ? '...' : totalSales.toString(), icon: TrendingUp, color: 'text-emerald-500' },
        { label: 'Ventas Activas', value: loadingSales ? '...' : activeSales.toString(), icon: LayoutDashboard, color: 'text-brand-500' },
        { label: 'Meta Mensual', value: loadingGoals ? '...' : currentGoal.toString(), icon: Users, color: 'text-amber-500' }
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hola, {user.firstName || user.username} 👋</h1>
                    <p className="text-slate-400">Resumen de {format(now, 'MMMM yyyy')}</p>
                </div>
                <div className="flex items-center gap-4">
                    {realtimeUpdate && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                            <Activity className="w-4 h-4 animate-pulse" />
                            <span>Actualizado: {format(realtimeUpdate, 'HH:mm:ss')}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all w-fit"
                    >
                        <Plus size={18} />
                        <span>Nueva Venta</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-6 rounded-2xl glass-hover hover:scale-[1.02]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-xl bg-slate-950/50 ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Meta Progress Card */}
            {currentGoal > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-8 rounded-2xl border-l-4 border-l-brand-500 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-white font-bold text-xl leading-none tracking-tight">Progreso de la Meta Mensual</h3>
                                <p className="text-slate-400 text-base mt-2">
                                    Has logrado <span className="text-white font-semibold">{activeSales}</span> de <span className="text-white font-semibold">{currentGoal}</span> ventas.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-brand-500">{goalProgress}%</span>
                                <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Completado</p>
                            </div>
                        </div>
                        <div className="w-full h-4 bg-slate-800/50 rounded-full overflow-hidden p-1 border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${goalProgress}%` }}
                                transition={{ duration: 1.2, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.4)]"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-500" />
                                Tendencia de Ventas
                            </h3>
                            <p className="text-sm text-slate-500">Desempeño diario en el mes actual</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-400">
                            <Calendar size={14} />
                            {format(now, 'MMMM yyyy', { locale: es })}
                        </div>
                    </div>
                    <div className="h-[300px] min-h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height={300} minWidth={0}>
                            <AreaChart data={salesByDayData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={2}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    name="Ventas Totales"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-6">Distribución por Estado</h3>
                    <div className="h-[300px] min-h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height={300} minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={salesByStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {salesByStatusData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {salesByStatusData.map((status: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                    <span className="text-slate-400">{status.name}</span>
                                </div>
                                <span className="text-white font-bold">{status.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 glass p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
                {loadingSales ? (
                    <div className="text-slate-400">Cargando datos...</div>
                ) : sales?.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                        <p>No hay ventas registradas este mes.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                        >
                            Nueva Venta
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-800">
                                    <th className="pb-3 pl-2">Cliente</th>
                                    <th className="pb-3">Fecha</th>
                                    <th className="pb-3">Estado</th>
                                    <th className="pb-3">Compañía</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {sales?.slice(0, 5).map((sale: any) => (
                                    <tr key={sale.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                                        <td className="py-3 pl-2 font-medium">{sale.clientName}</td>
                                        <td className="py-3 text-sm text-slate-400">{format(new Date(sale.saleDate), 'dd/MM/yyyy')}</td>
                                        <td className="py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: sale.saleStatus?.color + '20', color: sale.saleStatus?.color }}>
                                                {sale.saleStatus?.name}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm">{sale.company?.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <SalesFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
