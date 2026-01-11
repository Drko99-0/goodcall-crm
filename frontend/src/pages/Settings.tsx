import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Layers, Tag } from 'lucide-react';
import ItemManager from '../components/settings/ItemManager';
import companiesService from '../services/companies.service';
import technologiesService from '../services/technologies.service';
import saleStatusesService from '../services/sale-statuses.service';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'companies' | 'technologies' | 'statuses'>('companies');

    const tabs = [
        { id: 'companies', label: 'Compañías', icon: Database },
        { id: 'technologies', label: 'Tecnologías', icon: Layers },
        { id: 'statuses', label: 'Estados de Venta', icon: Tag },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Configuración</h1>
                    <p className="text-slate-400 mt-1">Gestión de maestros y parámetros del sistema</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar de Tabs */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 font-medium'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'companies' && (
                        <ItemManager
                            title="Compañías"
                            queryKey="companies"
                            fetchFn={companiesService.getAll}
                            createFn={companiesService.create}
                            updateFn={companiesService.update}
                            itemType="company"
                        />
                    )}
                    {activeTab === 'technologies' && (
                        <ItemManager
                            title="Tecnologías"
                            queryKey="technologies"
                            fetchFn={technologiesService.getAll}
                            createFn={technologiesService.create}
                            updateFn={technologiesService.update}
                            itemType="technology"
                        />
                    )}
                    {activeTab === 'statuses' && (
                        <ItemManager
                            title="Estados de Venta"
                            queryKey="statuses"
                            fetchFn={saleStatusesService.getAll}
                            createFn={saleStatusesService.create}
                            updateFn={saleStatusesService.update}
                            hasColor={true}
                            itemType="status"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
