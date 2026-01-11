import { useState, useMemo, useEffect } from 'react';
import { fuzzySearchService, FuzzySearchResult } from '../services/fuzzy-search.service';

/**
 * Opciones para el hook de búsqueda fuzzy
 */
interface UseFuzzySearchOptions<T> {
    data: T[];
    keys?: Array<string | any>;
    threshold?: number;
    minMatchCharLength?: number;
    maxScore?: number;
    immediate?: boolean;
    preset?: 'general' | 'strict' | 'flexible';
}

/**
 * Resultado del hook de búsqueda fuzzy
 */
interface UseFuzzySearchResult<T> {
    results: T[];
    fuzzyResults: FuzzySearchResult<T>[];
    query: string;
    setQuery: (query: string) => void;
    isSearching: boolean;
    resultCount: number;
}

/**
 * Hook para búsqueda fuzzy con Fuse.js
 *
 * @example
 * ```tsx
 * const { results, query, setQuery, isSearching, resultCount } = useFuzzySearch(users, {
 *   keys: ['firstName', 'lastName', 'username'],
 *   maxScore: 0.4,
 * });
 *
 * return (
 *   <>
 *     <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *     <span>Found {resultCount} results</span>
 *     {results.map(user => <UserCard key={user.id} user={user} />)}
 *   </>
 * );
 * ```
 */
export function useFuzzySearch<T>(
    data: T[],
    options: UseFuzzySearchOptions<T> = {}
): UseFuzzySearchResult<T> {
    const {
        keys,
        threshold,
        minMatchCharLength,
        maxScore = 0.5,
        immediate = false,
        preset = 'general',
    } = options;

    const [query, setQueryState] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Realizar búsqueda fuzzy
    const { fuzzyResults, results } = useMemo(() => {
        if (!query || query.trim().length === 0) {
            return {
                fuzzyResults: data.map(item => ({ item })),
                results: data,
            };
        }

        setIsSearching(true);

        let searchResults: FuzzySearchResult<T>[];

        if (keys) {
            searchResults = fuzzySearchService.customSearch(data, query, keys, preset);
        } else {
            searchResults = fuzzySearchService.search(data, query, {
                threshold,
                minMatchCharLength,
            });
        }

        // Filtrar por score
        const filtered = fuzzySearchService.filterByScore(searchResults, maxScore);

        // Ordenar por relevancia
        const sorted = fuzzySearchService.sortByScore(filtered);

        setIsSearching(false);

        return {
            fuzzyResults: sorted,
            results: sorted.map(r => r.item),
        };
    }, [data, query, keys, threshold, minMatchCharLength, maxScore, preset]);

    // Wrapper para setQuery que puede debouncear
    const setQuery = useMemo(() => {
        if (!immediate) {
            return setQueryState;
        }

        // Para búsqueda inmediata, simplemente setear el query
        return (newQuery: string) => {
            setQueryState(newQuery);
        };
    }, [immediate]);

    const resultCount = results.length;

    return {
        results,
        fuzzyResults,
        query,
        setQuery,
        isSearching,
        resultCount,
    };
}

/**
 * Hook específico para búsqueda de ventas
 */
export function useSalesFuzzySearch(sales: any[], query: string) {
    return useMemo(() => {
        if (!query || query.trim().length === 0) {
            return sales;
        }
        const results = fuzzySearchService.searchSales(sales, query);
        return fuzzySearchService.filterByScore(results, 0.4).map(r => r.item);
    }, [sales, query]);
}

/**
 * Hook específico para búsqueda de usuarios
 */
export function useUsersFuzzySearch(users: any[], query: string) {
    return useMemo(() => {
        if (!query || query.trim().length === 0) {
            return users;
        }
        const results = fuzzySearchService.searchUsers(users, query);
        return fuzzySearchService.filterByScore(results, 0.4).map(r => r.item);
    }, [users, query]);
}

/**
 * Hook específico para búsqueda de compañías
 */
export function useCompaniesFuzzySearch(companies: any[], query: string) {
    return useMemo(() => {
        if (!query || query.trim().length === 0) {
            return companies;
        }
        const results = fuzzySearchService.searchCompanies(companies, query);
        return fuzzySearchService.filterByScore(results, 0.4).map(r => r.item);
    }, [companies, query]);
}

/**
 * Hook con debounce para búsqueda en tiempo real
 */
export function useDebouncedFuzzySearch<T>(
    data: T[],
    options: UseFuzzySearchOptions<T> & { debounceMs?: number } = {}
) {
    const { debounceMs = 300, ...searchOptions } = options;

    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [localQuery, setLocalQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(localQuery);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localQuery, debounceMs]);

    const searchResults = useFuzzySearch(data, {
        ...searchOptions,
        keys: searchOptions.keys,
    });

    // Usar el query debounced para la búsqueda
    const debouncedResults = useFuzzySearch(data, {
        ...searchOptions,
        keys: searchOptions.keys,
    });

    return {
        ...debouncedResults,
        query: localQuery,
        setQuery: setLocalQuery,
    };
}

export default useFuzzySearch;
