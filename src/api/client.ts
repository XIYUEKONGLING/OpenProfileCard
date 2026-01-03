import { useAuthStore } from '../stores/auth';

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
        await authStore.logout();
        throw new Error('Unauthorized');
    }

    let json: any;
    const text = await response.text();
    try {
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error(`Invalid JSON response: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
        if (json.errors && typeof json.errors === 'object') {
            const errorMessages = Object.entries(json.errors)
                .map(([field, msgs]) => `${field}: ${(msgs as any[]).join(', ')}`)
                .join('\n');

            throw new Error(errorMessages || json.title || 'Validation Error');
        }
        if (json.title || json.detail) {
            throw new Error(json.detail || json.title);
        }
        throw new Error(json.Message || `Request failed with status ${response.status}`);
    }

    if (json.Status === false) {
        throw new Error(json.Message || 'Operation Failed');
    }

    return (json.Status !== undefined && json.Data !== undefined) ? json.Data : json;
}
