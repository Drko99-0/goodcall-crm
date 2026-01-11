import Fuse from 'fuse.js';

/**
 * Opciones de configuración para Fuse.js
 */
interface FuseOptions<T> {
    keys?: Array<string | Fuse.FuseOptionKeyObject<T>>;
    threshold?: number;
    distance?: number;
    minMatchCharLength?: number;
    includeMatches?: boolean;
    includeScore?: boolean;
    useExtendedSearch?: boolean;
}

/**
 * Resultado de búsqueda fuzzy
 */
export interface FuzzySearchResult<T> {
    item: T;
    score?: number;
    matches?: Fuse.FuseResultMatch[];
}

/**
 * Opciones por defecto para diferentes tipos de datos
 */
const DEFAULT_OPTIONS = {
    // Para búsquedas generales - balance entre precisión y tolerancia
    general: {
        threshold: 0.3,        // 0.0 = perfecto, 1.0 = anything
        distance: 100,         // Distancia máxima entre caracteres
        minMatchCharLength: 2, // Mínimo 2 caracteres para buscar
        includeMatches: true,  // Incluir información sobre matches
        includeScore: true,    // Incluir score de relevancia
        useExtendedSearch: true, // Permitir búsqueda avanzada
    },
    // Para búsquedas estrictas (IDs, códigos)
    strict: {
        threshold: 0.1,
        distance: 50,
        minMatchCharLength: 1,
        includeMatches: true,
        includeScore: true,
    },
    // Para búsquedas flexibles (nombres, descripciones)
    flexible: {
        threshold: 0.5,
        distance: 150,
        minMatchCharLength: 2,
        includeMatches: true,
        includeScore: true,
    },
};

/**
 * Servicio de búsqueda fuzzy usando Fuse.js
 * Permite búsquedas aproximadas y tolerantes a errores tipográficos
 *
 * @example
 * ```ts
 * const results = fuzzySearchService.search(users, 'Juan Perez', {
 *   keys: ['firstName', 'lastName', 'username']
 * });
 * ```
 */
class FuzzySearchService {
    /**
     * Búsqueda fuzzy en un array de datos
     */
    search<T>(
        data: T[],
        query: string,
        options: FuseOptions<T> = {}
    ): FuzzySearchResult<T>[] {
        if (!query || query.trim().length === 0) {
            return data.map(item => ({ item }));
        }

        const mergedOptions = {
            ...DEFAULT_OPTIONS.general,
            ...options,
        };

        const fuse = new Fuse(data, mergedOptions);
        const results = fuse.search(query);

        return results.map(result => ({
            item: result.item,
            score: result.score,
            matches: result.matches,
        }));
    }

    /**
     * Búsqueda fuzzy para ventas
     */
    searchSales(sales: any[], query: string): FuzzySearchResult<any>[] {
        return this.search(sales, query, {
            keys: [
                { name: 'clientName', weight: 2 },
                { name: 'clientDni', weight: 1.5 },
                { name: 'clientPhone', weight: 1.5 },
                { name: 'company.name', weight: 1 },
                { name: 'technology.name', weight: 1 },
                { name: 'asesor.firstName', weight: 0.8 },
                { name: 'asesor.lastName', weight: 0.8 },
                { name: 'asesor.username', weight: 1 },
            ],
            ...DEFAULT_OPTIONS.general,
        });
    }

    /**
     * Búsqueda fuzzy para usuarios
     */
    searchUsers(users: any[], query: string): FuzzySearchResult<any>[] {
        return this.search(users, query, {
            keys: [
                { name: 'username', weight: 2 },
                { name: 'email', weight: 1.5 },
                { name: 'firstName', weight: 1.5 },
                { name: 'lastName', weight: 1.5 },
                { name: 'role', weight: 1 },
            ],
            ...DEFAULT_OPTIONS.general,
        });
    }

    /**
     * Búsqueda fuzzy para compañías
     */
    searchCompanies(companies: any[], query: string): FuzzySearchResult<any>[] {
        return this.search(companies, query, {
            keys: [
                { name: 'name', weight: 2 },
                { name: 'code', weight: 1.5 },
            ],
            ...DEFAULT_OPTIONS.general,
        });
    }

    /**
     * Búsqueda fuzzy para tecnologías
     */
    searchTechnologies(technologies: any[], query: string): FuzzySearchResult<any>[] {
        return this.search(technologies, query, {
            keys: [
                { name: 'name', weight: 2 },
                { name: 'code', weight: 1.5 },
            ],
            ...DEFAULT_OPTIONS.general,
        });
    }

    /**
     * Búsqueda fuzzy para estados de venta
     */
    searchSaleStatuses(statuses: any[], query: string): FuzzySearchResult<any>[] {
        return this.search(statuses, query, {
            keys: [
                { name: 'name', weight: 2 },
                { name: 'code', weight: 1.5 },
            ],
            ...DEFAULT_OPTIONS.general,
        });
    }

    /**
     * Búsqueda fuzzy personalizada
     */
    customSearch<T>(
        data: T[],
        query: string,
        keys: Array<string | Fuse.FuseOptionKeyObject<T>>,
        preset: 'general' | 'strict' | 'flexible' = 'general'
    ): FuzzySearchResult<T>[] {
        return this.search(data, query, {
            keys,
            ...DEFAULT_OPTIONS[preset],
        });
    }

    /**
     * Filtra resultados por score mínimo
     */
    filterByScore<T>(results: FuzzySearchResult<T>[], maxScore: number = 0.5): FuzzySearchResult<T>[] {
        return results.filter(result =>
            result.score === undefined || result.score <= maxScore
        );
    }

    /**
     * Ordena resultados por score (mejores primero)
     */
    sortByScore<T>(results: FuzzySearchResult<T>[]): FuzzySearchResult<T>[] {
        return [...results].sort((a, b) => {
            const scoreA = a.score ?? 0;
            const scoreB = b.score ?? 0;
            return scoreA - scoreB;
        });
    }

    /**
     * Busca y retorna solo los items (sin metadata de búsqueda)
     */
    searchItemsOnly<T>(data: T[], query: string, options: FuseOptions<T> = {}): T[] {
        const results = this.search(data, query, options);
        return results.map(r => r.item);
    }

    /**
     * Busca con soporte para operadores extendidos
     * Operadores soportados:
     * - ' → prefijo exacto (ej: 'Juan → solo results que empiezan con Juan)
     * - ^ → comienza con (ej: ^admin → admin al inicio)
     * - $ → termina con (ej: .com$ → termina en .com)
     * - = → exacto (ej: =admin → solo admin exacto)
     * - ! → no contiene (ej: !test → no contiene test)
     */
    extendedSearch<T>(
        data: T[],
        query: string,
        keys: Array<string | Fuse.FuseOptionKeyObject<T>>
    ): T[] {
        if (!query || query.trim().length === 0) {
            return data;
        }

        const fuse = new Fuse(data, {
            keys,
            useExtendedSearch: true,
            includeMatches: false,
            includeScore: false,
            threshold: 0.3,
            distance: 100,
        });

        const results = fuse.search(query);
        return results.map(r => r.item);
    }
}

// Exportar instancia única
export const fuzzySearchService = new FuzzySearchService();

// Exportar clase para uso directo
export { FuzzySearchService };

export default fuzzySearchService;
