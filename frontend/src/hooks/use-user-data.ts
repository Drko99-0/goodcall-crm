import { useState, useEffect, useMemo } from 'react';
import type { User } from '../types';

interface UseUserDataResult {
    user: User | null;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
}

/**
 * Custom hook for managing user data from localStorage
 * Provides memoized user data, loading state, and refresh functionality
 *
 * @example
 * ```tsx
 * const { user, loading, error, refresh } = useUserData();
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (!user) return <Login />;
 *
 * return <Dashboard user={user} />;
 * ```
 */
export function useUserData(): UseUserDataResult {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Refresh user data from localStorage
     */
    const refresh = useMemo(() => {
        return () => {
            setLoading(true);
            setError(null);

            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const parsedUser = JSON.parse(userStr) as User;
                    setUser(parsedUser);
                } else {
                    setUser(null);
                }
                setError(null);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to parse user data');
                setError(error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
    }, []);

    // Initial load and listen for storage changes
    useEffect(() => {
        refresh();

        // Listen for storage changes (e.g., from other tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' || e.key === 'accessToken') {
                refresh();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [refresh]);

    return {
        user,
        loading,
        error,
        refresh,
    };
}

export default useUserData;
