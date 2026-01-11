import api from './api';

export interface Sale {
    id: string;
    asesorId: string;
    companyId?: string;
    saleStatusId?: string;
    saleDate: string;
    clientName?: string;
    clientDni?: string;
    clientPhone?: string;
    extraInfo?: string;
    address?: string; // Mantener por si acaso el esquema crece, aunque no está en Prisma
    products?: any[];
    createdAt: string;
    cerradorId?: string;
    fidelizadorId?: string;
    companySoldId?: string;
    technologyId?: string;
    saleStatus?: {
        name: string;
        color: string;
        code: string;
    };
    company?: {
        name: string;
        code: string;
    };
    companySold?: {
        name: string;
        code: string;
    };
    technology?: {
        name: string;
        code: string;
    };
    asesor?: {
        firstName: string;
        lastName: string;
    };
    cerrador?: {
        firstName: string;
        lastName: string;
    };
    fidelizador?: {
        firstName: string;
        lastName: string;
    };
}

export interface SalesFilter {
    asesorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

const salesService = {
    getAll: async (filter?: SalesFilter) => {
        const params = new URLSearchParams();
        if (filter?.asesorId) params.append('asesorId', filter.asesorId);
        if (filter?.startDate) params.append('startDate', filter.startDate);
        if (filter?.endDate) params.append('endDate', filter.endDate);
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.limit) params.append('limit', filter.limit.toString());

        const response = await api.get<any>(`/sales?${params.toString()}`);
        // Asumiendo que el backend retorna { data: Sale[], total: number, page: number, limit: number }
        // Si no, volvemos al array plano para no romper nada, pero el tipado sugiere Sale[]
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Sale>(`/sales/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post<Sale>('/sales', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.patch<Sale>(`/sales/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/sales/${id}`);
    }
};

export default salesService;
