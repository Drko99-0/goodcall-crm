import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Activity,
    FileBarChart,
    CheckCircle2,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/auth.service';
import notificationsService from '../services/notifications.service';
import ProfileModal from './modals/ProfileModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserData } from '../hooks/use-user-data';
import type { Notification, UserRole } from '../types';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, loading: userLoading } = useUserData();

    // Consultar notificaciones reales
    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: notificationsService.getAll,
        refetchInterval: 30000, // Cada 30 segs
        enabled: !!user
    });

    const markReadMutation = useMutation({
        mutationFn: notificationsService.markAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    const deleteMutation = useMutation({
        mutationFn: notificationsService.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    const handleLogout = () => {
        authService.logout();
    };

    if (userLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/sales', icon: ShoppingCart, label: 'Ventas' },
        ...(['developer', 'gerencia'].includes(user.role) ? [
            { path: '/users', icon: Users, label: 'Equipo' },
            { path: '/reports', icon: FileBarChart, label: 'Reportes' },
            { path: '/settings', icon: Settings, label: 'Configuración' }
        ] : user.role === 'coordinador' ? [
            { path: '/reports', icon: FileBarChart, label: 'Reportes' }
        ] : []),
        ...(['developer', 'gerencia'].includes(user.role) ? [
            { path: '/logs', icon: Activity, label: 'Logs' }
        ] : []),
    ];

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex">
            {/* Profile Modal */}
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed md:sticky top-0 h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 z-50 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20 hidden md:flex'}`}
            >
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white">
                                GC
                            </div>
                            <span className="font-bold text-xl text-white tracking-tight">GoodCall</span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white mx-auto">
                            GC
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 md:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-white'} />
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                {/* Global Header */}
                <header className="h-16 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md border-b border-slate-800 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                            <span className="capitalize">{location.pathname.split('/')[1] || 'Dashboard'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-brand-500/10 text-brand-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-slate-900"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 mt-3 w-80 glass border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                            <h4 className="font-bold text-white">Notificaciones</h4>
                                            {unreadCount > 0 && (
                                                <span className="text-[10px] uppercase tracking-widest text-brand-500 font-bold bg-brand-500/10 px-2 py-0.5 rounded">
                                                    {unreadCount} Nuevas
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-slate-500 italic text-sm">
                                                    No tienes notificaciones
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors relative group ${!n.isRead ? 'bg-brand-500/5' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1 pr-12">
                                                            <h5 className={`text-sm font-bold ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>{n.title}</h5>
                                                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>

                                                        {/* Actions on Hover */}
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!n.isRead && (
                                                                <button
                                                                    onClick={() => markReadMutation.mutate(n.id)}
                                                                    className="p-1.5 hover:bg-brand-500/10 text-brand-500 rounded-lg"
                                                                    title="Marcar como leída"
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteMutation.mutate(n.id)}
                                                                className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Profile */}
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="flex items-center gap-3 pl-4 border-l border-slate-800 group hover:opacity-80 transition-all"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-none group-hover:text-brand-400 transition-colors">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{user.role}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-white border-2 border-slate-800 shadow-lg group-hover:scale-105 transition-transform">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
