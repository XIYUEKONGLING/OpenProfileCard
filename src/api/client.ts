import { useAuthStore } from '../stores/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Core HTTP client using fetch API
 * Handles JWT injection and automatic token refresh logic
 */
export async function httpClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, headers, ...rest } = options;
    const authStore = useAuthStore();

    const config: RequestInit = {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(headers as Record<string, string>),
        },
    };

    if (requiresAuth && authStore.token) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${authStore.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Trigger refresh if unauthorized
    if (response.status === 401 && requiresAuth) {
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = authStore.refreshSession().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }

        const success = await refreshPromise;

        if (success) {
            return httpClient<T>(endpoint, options);
        } else {
            await authStore.logout();
            throw new Error('Session expired');
        }
    }

    let json: any;
    const text = await response.text();
    try {
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error(`Invalid JSON response: ${response.status}`);
    }

    if (!response.ok) {
        if (json.errors) throw new Error(Object.values(json.errors).flat().join(', '));
        throw new Error(json.Message || json.detail || `Error ${response.status}`);
    }

    return (json.Status !== undefined && json.Data !== undefined) ? json.Data : json;
}
