import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../api/client';
import type {
    TokenResponseDto,
    AccountDto,
    LoginRequestDto,
    RegisterRequestDto,
    SendCodeRequestDto
} from '@/api/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('at'));
    const refreshToken = ref<string | null>(localStorage.getItem('rt'));
    const user = ref<AccountDto | null>(null);

    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.Role === 1000 || user.value?.Role === -1);


    async function login(credentials: LoginRequestDto) {
        const data = await httpClient<TokenResponseDto>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            requiresAuth: false
        });
        saveSession(data);
        await fetchMe();
    }

    async function register(payload: RegisterRequestDto) {
        const data = await httpClient<TokenResponseDto>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
            requiresAuth: false
        });
        saveSession(data);
        await fetchMe();
    }

    async function sendCode(payload: SendCodeRequestDto) {
        await httpClient('/auth/send-code', {
            method: 'POST',
            body: JSON.stringify(payload),
            requiresAuth: false
        });
    }

    async function fetchMe() {
        if (!token.value) return;
        try {
            const data = await httpClient<AccountDto>('/me');
            user.value = data;
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            logout();
        }
    }

    async function refreshSession(): Promise<boolean> {
        if (!refreshToken.value || !token.value) return false;
        try {
            const data = await httpClient<TokenResponseDto>('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ AccessToken: token.value, RefreshToken: refreshToken.value }),
                requiresAuth: false
            });
            saveSession(data);
            return true;
        } catch {
            return false;
        }
    }

    function saveSession(data: TokenResponseDto) {
        token.value = data.AccessToken;
        localStorage.setItem('at', data.AccessToken);
        if (data.RefreshToken) {
            refreshToken.value = data.RefreshToken;
            localStorage.setItem('rt', data.RefreshToken);
        }
    }


    async function logout() {
        try {
            if (token.value) {
                await httpClient('/auth/logout', { method: 'POST' });
            }
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            token.value = null;
            refreshToken.value = null;
            user.value = null;
            localStorage.removeItem('at');
            localStorage.removeItem('rt');
        }
    }

    return {
        token,
        user,
        isAuthenticated,
        isAdmin,
        login,
        register,
        sendCode,
        fetchMe,
        refreshSession,
        logout
    };
});
