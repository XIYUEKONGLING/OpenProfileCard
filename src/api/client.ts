import { useAuthStore } from '../stores/auth';
import type { ApiResponse } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

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
        const success = await authStore.refreshSession();
        if (success) return httpClient<T>(endpoint, options);
        authStore.logout();
        throw new Error('Unauthorized');
    }

    const json: ApiResponse<T> = await response.json();
    if (!response.ok || !json.Status) {
        throw new Error(json.Message || 'API_ERROR');
    }

    return json.Data as T;
}
