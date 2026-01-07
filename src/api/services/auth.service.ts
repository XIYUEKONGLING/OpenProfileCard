import { httpClient } from '../client';
import type {
    AuthConfigDto,
    SendCodeRequestDto,
    RegisterRequestDto,
    LoginRequestDto,
    RefreshTokenRequestDto,
    TokenResponseDto,
    MessageResponse
} from '../types';

/**
 * Authentication Service
 * Handles login, registration, token refresh, and email verification
 */
export const authApi = {
    /**
     * Get authentication configuration
     * GET /api/auth/config
     */
    getConfig: (): Promise<AuthConfigDto> =>
        httpClient<AuthConfigDto>('/auth/config', { requiresAuth: false }),

    /**
     * Send verification code
     * POST /api/auth/send-code
     */
    sendCode: (data: SendCodeRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/auth/send-code', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify(data)
        }),

    /**
     * Register new account
     * POST /api/auth/register
     */
    register: (data: RegisterRequestDto): Promise<TokenResponseDto> =>
        httpClient<TokenResponseDto>('/auth/register', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify(data)
        }),

    /**
     * Login
     * POST /api/auth/login
     */
    login: (data: LoginRequestDto): Promise<TokenResponseDto> =>
        httpClient<TokenResponseDto>('/auth/login', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify(data)
        }),

    /**
     * Exchange refresh token for new access token
     * POST /api/auth/refresh
     */
    refresh: (data: RefreshTokenRequestDto): Promise<TokenResponseDto> =>
        httpClient<TokenResponseDto>('/auth/refresh', {
            method: 'POST',
            requiresAuth: false,
            body: JSON.stringify(data)
        }),

    /**
     * Logout (revoke specific token)
     * POST /api/auth/logout
     */
    logout: (data: RefreshTokenRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/auth/logout', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Logout from all devices (reset security stamp)
     * POST /api/auth/logout-all
     */
    logoutAll: (): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/auth/logout-all', {
            method: 'POST'
        })
};
