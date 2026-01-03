import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../api/client';
import type { TokenResponseDto, AccountDto, LoginRequestDto } from '../api/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('at'));
    const refreshToken = ref<string | null>(localStorage.getItem('rt'));
    const user = ref<AccountDto | null>(null);

    const isAuthenticated = computed(() => !!token.value);
    const isAdmin = computed(() => user.value?.Role === 1000 || user.value?.Role === -1);

    /**
     * Sign in and initialize session
     */
    async function login(credentials: LoginRequestDto) {
        const data = await httpClient<TokenResponseDto>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            requiresAuth: false
        });
        saveSession(data);
        await fetchMe();
    }

    async function fetchMe() {
        if (!token.value) return;
        const data = await httpClient<AccountDto>('/me');
        user.value = data;
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

    function logout() {
        token.value = null;
        refreshToken.value = null;
        user.value = null;
        localStorage.clear();
    }

    return { token, user, isAuthenticated, isAdmin, login, fetchMe, refreshSession, logout };
});
