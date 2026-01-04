import { useAuthStore } from '../stores/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Helper to determine the static JSON fallback URL
 */
function getStaticUrl(url: string): string {
    // If the URL is just the base (e.g., /api or /api/), fetch index.json
    if (url === BASE_URL || url === `${BASE_URL}/`) {
        return `${BASE_URL}/index.json`;
    }
    // Otherwise, append .json extension
    return url.endsWith('.json') ? url : `${url}.json`;
}

/**
 * Core HTTP client with static JSON fallback
 */
export async function httpClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, headers, method = 'GET', ...rest } = options;
    const authStore = useAuthStore();

    const config: RequestInit = {
        method,
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(headers as Record<string, string>),
        },
    };

    if (requiresAuth && authStore.token) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${authStore.token}`;
    }

    const url = `${BASE_URL}${endpoint}`;
    let response: Response;

    try {
        response = await fetch(url, config);

        // Fallback logic: If GET returns 404, try the .json version
        if (response.status === 404 && method.toUpperCase() === 'GET') {
            const fallbackUrl = getStaticUrl(url);
            const fallbackResponse = await fetch(fallbackUrl, config);
            if (fallbackResponse.ok) {
                response = fallbackResponse;
            }
        }
    } catch (error) {
        // Fallback logic: If network fails on GET, try the .json version
        if (method.toUpperCase() === 'GET') {
            const fallbackUrl = getStaticUrl(url);
            response = await fetch(fallbackUrl, config);
        } else {
            throw error;
        }
    }

    // Handle Token Refresh (401)
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

    const text = await response.text();
    let json: any;

    try {
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error(`Invalid JSON response: ${response.status}`);
    }

    if (!response.ok) {
        if (json.errors) throw new Error(Object.values(json.errors).flat().join(', '));
        throw new Error(json.Message || json.detail || `Error ${response.status}`);
    }

    // Unwrap ApiResponse<T> if present
    return (json.Status !== undefined && json.Data !== undefined) ? json.Data : json;
}
