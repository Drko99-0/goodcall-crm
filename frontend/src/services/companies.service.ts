import api from './api';
import type { Company, CompanyCreateInput, CompanyUpdateInput } from '../types';

/**
 * Re-export Company type for backward compatibility
 * @deprecated Import from '../types' instead
 */
export type { Company } from '../types';

const companiesService = {
    getAll: async (): Promise<Company[]> => {
        try {
            const response = await api.get<Company[]>('/companies');
            return response.data;
        } catch (error) {
            console.error('Error fetching companies:', error);
            throw error;
        }
    },

    create: async (data: CompanyCreateInput): Promise<Company> => {
        try {
            const response = await api.post<Company>('/companies', data);
            return response.data;
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        }
    },

    update: async (id: string, data: CompanyUpdateInput): Promise<Company> => {
        try {
            const response = await api.patch<Company>(`/companies/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating company ${id}:`, error);
            throw error;
        }
    }
};

export default companiesService;
