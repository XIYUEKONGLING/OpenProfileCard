import { httpClient } from '../client';
import type {
    SystemStatusDto,
    UserFilterDto,
    UserAdminDto,
    PagedResponse,
    CreateUserRequestDto,
    UpdateUserStatusRequestDto,
    UpdateUserRoleRequestDto,
    AccountEmailDto,
    AddEmailRequestDto,
    MessageResponse,
    OrganizationMemberDto,
    InviteMemberRequestDto,
    UpdateMemberRequestDto,
    SystemSettingDto,
    UpdateSystemSettingRequestDto,
    SystemAssetDto,
    CreateSystemAssetRequestDto,
    UpdateSystemAssetRequestDto,
    UpdateSiteMetadataRequestDto
} from '../types';

/**
 * Admin Service
 * Handles system administration (dynamic / protected)
 */
export const adminApi = {
    /**
     * System Overview
     */

    /**
     * Get system status overview
     * GET /api/admin/system/status
     */
    getSystemStatus: (): Promise<SystemStatusDto> =>
        httpClient<SystemStatusDto>('/admin/system/status'),

    /**
     * User & Account Management
     */

    /**
     * List users
     * GET /api/admin/users
     */
    getUsers: (params: UserFilterDto & { page?: number; pageSize?: number }): Promise<PagedResponse<UserAdminDto>> => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
        if (params.Status !== undefined) queryParams.append('status', params.Status.toString());
        if (params.Role !== undefined) queryParams.append('role', params.Role.toString());
        if (params.Type !== undefined) queryParams.append('type', params.Type.toString());
        if (params.Search !== undefined) queryParams.append('search', params.Search);
        const queryString = queryParams.toString();
        return httpClient<PagedResponse<UserAdminDto>>(`/admin/users${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Force create user/org
     * POST /api/admin/users
     */
    createUser: (data: CreateUserRequestDto): Promise<UserAdminDto> =>
        httpClient<UserAdminDto>('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Change status
     * PATCH /api/admin/users/{user}/status
     */
    updateUserStatus: (user: string, data: UpdateUserStatusRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/status`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Physical delete
     * DELETE /api/admin/users/{user}
     */
    deleteUser: (user: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}`, { method: 'DELETE' }),

    /**
     * Promote/demote
     * POST /api/admin/users/{user}/role
     */
    updateUserRole: (user: string, data: UpdateUserRoleRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/role`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Force reset password
     * POST /api/admin/users/{user}/password/reset
     */
    resetPassword: (user: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/password/reset`, { method: 'POST' }),

    /**
     * Send notification
     * POST /api/admin/users/{user}/notifications
     */
    sendNotification: (user: string, data: { title: string; body: string; url?: string }): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/notifications`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * List user emails
     * GET /api/admin/users/{user}/emails
     */
    getUserEmails: (user: string): Promise<AccountEmailDto[]> =>
        httpClient<AccountEmailDto[]>(`/admin/users/${user}/emails`),

    /**
     * Force add email
     * POST /api/admin/users/{user}/emails
     */
    addUserEmail: (user: string, data: AddEmailRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/emails`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Update email status
     * PATCH /api/admin/users/{user}/emails/{email}
     */
    updateUserEmail: (user: string, email: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/emails/${encodeURIComponent(email)}`, { method: 'PATCH' }),

    /**
     * Force remove email
     * DELETE /api/admin/users/{user}/emails/{email}
     */
    deleteUserEmail: (user: string, email: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/users/${user}/emails/${encodeURIComponent(email)}`, { method: 'DELETE' }),

    /**
     * Organization Administration (Force Actions)
     */

    /**
     * List members
     * GET /api/admin/orgs/{org}/members
     */
    getOrgMembers: (org: string): Promise<OrganizationMemberDto[]> =>
        httpClient<OrganizationMemberDto[]>(`/admin/orgs/${org}/members`),

    /**
     * Force add
     * POST /api/admin/orgs/{org}/members
     */
    addOrgMember: (org: string, data: InviteMemberRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/orgs/${org}/members`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Force update
     * PATCH /api/admin/orgs/{org}/members/{user}
     */
    updateOrgMember: (org: string, user: string, data: UpdateMemberRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/orgs/${org}/members/${user}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Force kick
     * DELETE /api/admin/orgs/{org}/members/{user}
     */
    removeOrgMember: (org: string, user: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/orgs/${org}/members/${user}`, { method: 'DELETE' }),

    /**
     * System Configuration (Runtime)
     */

    /**
     * List all settings
     * GET /api/admin/system-settings
     */
    getSystemSettings: (): Promise<SystemSettingDto[]> =>
        httpClient<SystemSettingDto[]>('/admin/system-settings'),

    /**
     * Get specific setting
     * GET /api/admin/system-settings/{key}
     */
    getSystemSetting: (key: string): Promise<SystemSettingDto> =>
        httpClient<SystemSettingDto>(`/admin/system-settings/${key}`),

    /**
     * Update setting
     * PUT /api/admin/system-settings/{key}
     */
    updateSystemSetting: (key: string, data: UpdateSystemSettingRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/system-settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    /**
     * Site Metadata Management
     */

    /**
     * Full update site metadata
     * POST /api/admin/meta
     */
    updateSiteMetadata: (data: UpdateSiteMetadataRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/admin/meta', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update site metadata
     * PATCH /api/admin/meta
     */
    patchSiteMetadata: (data: UpdateSiteMetadataRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/admin/meta', {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * System Assets (Admin Only)
     */

    /**
     * List all system assets
     * GET /api/admin/assets
     */
    getSystemAssets: (params: {
        page?: number;
        pageSize?: number;
        category?: string;
        visibility?: number;
    } = {}): Promise<PagedResponse<SystemAssetDto>> => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
        if (params.category !== undefined) queryParams.append('category', params.category);
        if (params.visibility !== undefined) queryParams.append('visibility', params.visibility.toString());
        const queryString = queryParams.toString();
        return httpClient<PagedResponse<SystemAssetDto>>(`/admin/assets${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get specific system asset
     * GET /api/admin/assets/{uuid}
     */
    getSystemAsset: (uuid: string): Promise<SystemAssetDto> =>
        httpClient<SystemAssetDto>(`/admin/assets/${uuid}`),

    /**
     * Create system asset
     * POST /api/admin/assets
     */
    createSystemAsset: (data: CreateSystemAssetRequestDto): Promise<SystemAssetDto> =>
        httpClient<SystemAssetDto>('/admin/assets', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Full update system asset
     * PUT /api/admin/assets/{uuid}
     */
    updateSystemAsset: (uuid: string, data: CreateSystemAssetRequestDto): Promise<SystemAssetDto> =>
        httpClient<SystemAssetDto>(`/admin/assets/${uuid}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update system asset
     * PATCH /api/admin/assets/{uuid}
     */
    patchSystemAsset: (uuid: string, data: UpdateSystemAssetRequestDto): Promise<SystemAssetDto> =>
        httpClient<SystemAssetDto>(`/admin/assets/${uuid}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Delete system asset
     * DELETE /api/admin/assets/{uuid}
     */
    deleteSystemAsset: (uuid: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/admin/assets/${uuid}`, { method: 'DELETE' })
};
