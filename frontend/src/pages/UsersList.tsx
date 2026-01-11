import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import usersService, { User } from '../services/users.service';
import UserFormModal from '../components/modals/UserFormModal';
import {
    Search,
    Plus,
    MoreVertical,
    Shield,
    Users as UsersIcon,
    UserCircle,
    Lock
} from 'lucide-react';
import { format } from 'date-fns';

const UsersList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

    const { data: users, isLoading, isError } = useQuery({
        queryKey: ['users', 'list'],
        queryFn: usersService.getAll
    });

    const handleNewUser = () => {
        setUserToEdit(undefined);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const filteredUsers = users?.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            developer: 'bg-indigo-500/20 text-indigo-400',
            gerencia: 'bg-purple-500/20 text-purple-400',
            coordinador: 'bg-blue-500/20 text-blue-400',
            asesor: 'bg-emerald-500/20 text-emerald-400',
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${colors[role] || 'bg-slate-700 text-slate-300'}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userToEdit={userToEdit}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Equipo</h1>
                    <p className="text-slate-400 mt-1">Gestión de usuarios y accesos</p>
                </div>
                <button
                    onClick={handleNewUser}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
                >
                    <Plus size={18} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {/* Search */}
            <div className="glass p-4 rounded-xl flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, usuario o email..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Grid */}
            {isLoading ? (
                <div className="p-12 flex justify-center items-center text-slate-400">
                    <div className="animate-spin mr-3 h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                    Cargando equipo...
                </div>
            ) : isError ? (
                <div className="p-12 text-center text-red-400">
                    Error al cargar usuarios.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="glass p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
                            {!user.isActive && (
                                <div className="absolute top-0 right-0 bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-bl-lg font-bold border-l border-b border-red-500/20">
                                    INACTIVO
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xl uppercase">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <button
                                    onClick={() => handleEditUser(user)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    {user.firstName} {user.lastName}
                                    {user.isLocked && (
                                        <span title="Cuenta bloqueada">
                                            <Lock size={14} className="text-red-400" />
                                        </span>
                                    )}
                                </h3>
                                <div className="text-sm text-slate-400 mb-4 flex flex-col gap-1">
                                    <span className="flex items-center gap-2">
                                        <UserCircle size={14} /> @{user.username}
                                    </span>
                                    <span className="flex items-center gap-2 text-xs opacity-75">
                                        Creado el {format(new Date(), 'dd/MM/yyyy')}
                                        {/* TODO: Add createdAt to interface/backend return */}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    {getRoleBadge(user.role)}
                                    {/* Aquí podríamos poner indicador de ventas del mes, etc */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsersList;
