// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { httpClient } from '../api/client';
import type {
    TokenResponseDto,
    AccountDto,
    LoginRequestDto,
    RegisterRequestDto,
    SendCodeRequestDto,
    AccountRole,
    AccountType, RefreshTokenRequestDto
} from '@/api/types';

export const useAuthStore = defineStore('auth', () => {
    // 基础状态
    const token = ref<string | null>(localStorage.getItem('at'));
    const refreshToken = ref<string | null>(localStorage.getItem('rt'));
    const user = ref<AccountDto | null>(null);

    // --- 计算属性 (基于 user 对象即时计算) ---

    /** 是否已登录 */
    const isAuthenticated = computed(() => !!token.value);

    /** 当前用户角色 (-1: Root, 0: User, 1000: Admin) */
    const role = computed<AccountRole | null>(() => user.value?.Role ?? null);

    /** 账号类型数值 */
    const type = computed<AccountType | null>(() => user.value?.Type ?? null);

    /** 是否为超级管理员 (Root) */
    const isRoot = computed(() => user.value?.Role === -1);

    /** 是否为管理员 (Admin 或 Root) */
    const isAdmin = computed(() => user.value?.Role === 1000 || user.value?.Role === -1);

    /**
     * 辅助函数：检查是否具备特定角色
     * 比如: v-if="auth.hasRole(1000)"
     */
    const hasRole = (r: AccountRole) => user.value?.Role === r;

    // --- 逻辑操作 ---

    /**
     * 获取当前用户信息（包含权限/角色）
     * 对应 GET /api/me
     */
    async function fetchMe() {
        if (!token.value) return;
        try {
            // 规范中 /api/me 返回 AccountDto，包含 Role 和 Type
            const data = await httpClient<AccountDto>('/me');
            user.value = data;
        } catch (error) {
            console.error('Failed to fetch user permissions:', error);
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
        try {
            if (token.value && refreshToken.value) {
                const payload: RefreshTokenRequestDto = {
                    AccessToken: token.value,
                    RefreshToken: refreshToken.value
                };
                await httpClient('/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
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

    async function resetPassword(payload: any) {
        await httpClient('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(payload),
            requiresAuth: false
        });
    }

    return {
        token,
        user,
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
