import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../api/client';
import {
    type TokenResponseDto,
    type AccountDto,
    type ProfileDto,
    type LoginRequestDto,
    type RegisterRequestDto,
    type SendCodeRequestDto,
    type ResetPasswordRequestDto,
    type RefreshTokenRequestDto,
    type AccountRole,
    AccountType
} from '@/api/types';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('at'));
    const refreshToken = ref<string | null>(localStorage.getItem('rt'));

    // Account info (Email, Role, Status)
    const user = ref<AccountDto | null>(null);
    // Profile info (Avatar, DisplayName) for UI/Sidebar
    const profile = ref<ProfileDto | null>(null);

    const isAuthenticated = computed(() => !!token.value);

    const role = computed<AccountRole | null>(() => user.value?.Role ?? null);
    const type = computed<AccountType | null>(() => user.value?.Type ?? null);

    const isRoot = computed(() => user.value?.Role === -1);
    const isAdmin = computed(() => user.value?.Role === 1000 || user.value?.Role === -1);

    const hasRole = (r: AccountRole) => user.value?.Role === r;

    async function fetchMe() {
        if (!token.value) return;
        try {
            // Parallel fetch: Account info (Security) & Profile info (Visuals)
            const [accountData, profileData] = await Promise.all([
                httpClient<AccountDto>('/me'),
                httpClient<ProfileDto>('/me/profile').catch(() => null) // Profile might fail if not set up, handle gracefully
            ]);

            user.value = accountData;
            profile.value = profileData;

        } catch (error) {
            console.error('Failed to fetch user session:', error);
            await logout();
        }
    }

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

    async function refreshSession(): Promise<boolean> {
        if (!refreshToken.value || !token.value) return false;
        try {
            const payload: RefreshTokenRequestDto = {
                AccessToken: token.value,
                RefreshToken: refreshToken.value
            };
            const data = await httpClient<TokenResponseDto>('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify(payload),
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
        const payload: RefreshTokenRequestDto | null = (token.value && refreshToken.value)
            ? { AccessToken: token.value, RefreshToken: refreshToken.value }
            : null;

        try {
            if (payload) {
                await httpClient('/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }
        } catch (error) {
            console.warn('Logout API failed (session might already be invalidated):', error);
        } finally {
            token.value = null;
            refreshToken.value = null;
            user.value = null;
            profile.value = null;
            localStorage.removeItem('at');
            localStorage.removeItem('rt');
        }
    }

    async function resetPassword(payload: ResetPasswordRequestDto) {
        await httpClient('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(payload),
            requiresAuth: false
        });
    }

    return {
        token,
        user,
        profile, // Exported for use in Layout
        isAuthenticated,
        role,
        type,
        isAdmin,
        isRoot,
        hasRole,
        login,
        register,
        sendCode,
        fetchMe,
        refreshSession,
        logout,
        resetPassword
    };
});
