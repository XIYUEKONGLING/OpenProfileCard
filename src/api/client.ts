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
    let usedJsonFallback = false;

    try {
        response = await fetch(url, config);

        // Fallback logic: If GET doesn't return 200 OK, try the .json version
        // This handles 404, 3xx redirects, and other non-200 responses from static hosting
        if (!response.ok && method.toUpperCase() === 'GET') {
            const fallbackUrl = getStaticUrl(url);
            const fallbackResponse = await fetch(fallbackUrl, config);
            if (fallbackResponse.ok) {
                response = fallbackResponse;
                usedJsonFallback = true;
            }
        }
    } catch (error) {
        // Fallback logic: If network fails on GET, try the .json version
        if (method.toUpperCase() === 'GET') {
            const fallbackUrl = getStaticUrl(url);
            response = await fetch(fallbackUrl, config);
            usedJsonFallback = true;
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
        // If JSON parsing fails and this is a GET request, try the .json version
        // This handles cases where static hosting returns 200 with HTML content
        if (method.toUpperCase() === 'GET' && !usedJsonFallback && !url.endsWith('.json')) {
            const fallbackUrl = getStaticUrl(url);
            try {
                const fallbackResponse = await fetch(fallbackUrl, config);
                const fallbackText = await fallbackResponse.text();
                json = fallbackText ? JSON.parse(fallbackText) : {};
                response = fallbackResponse;
            } catch (fallbackError) {
                throw new Error(`Invalid JSON response from ${url} and ${fallbackUrl}`);
            }
        } else {
            throw new Error(`Invalid JSON response: ${response.status}`);
        }
    }

    if (!response.ok) {
        if (json.errors) throw new Error(Object.values(json.errors).flat().join(', '));
        throw new Error(json.Message || json.detail || `Error ${response.status}`);
    }

    // Unwrap ApiResponse<T> if present
    return (json.Status !== undefined && json.Data !== undefined) ? json.Data : json;
}
