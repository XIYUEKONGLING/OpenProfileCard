import { httpClient } from '../client';
import type {
    AccountAssetDto,
    PublicAssetDto,
    CreateAccountAssetRequestDto,
    UpdateAccountAssetRequestDto,
    CreateSystemAssetRequestDto,
    UpdateSystemAssetRequestDto,
    BatchDeleteRequestDto,
    BatchUpdateVisibilityRequestDto,
    LookupAssetDto,
    PagedResponse,
    MessageResponse,
    SystemAssetDto
} from '../types';

/**
 * Assets Service
 * Handles personal and organization asset library management
 */
export const assetsApi = {
    /**
     * Personal Asset Library
     */

    /**
     * List my assets (paginated)
     * GET /api/me/assets
     */
    getPersonalAssets: (params: {
        page?: number;
        pageSize?: number;
        category?: string;
        visibility?: number;
        search?: string;
    } = {}): Promise<PagedResponse<AccountAssetDto>> => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
        if (params.category !== undefined) queryParams.append('category', params.category);
        if (params.visibility !== undefined) queryParams.append('visibility', params.visibility.toString());
        if (params.search !== undefined) queryParams.append('search', params.search);
        const queryString = queryParams.toString();
        return httpClient<PagedResponse<AccountAssetDto>>(`/me/assets${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get specific asset (my own)
     * GET /api/me/assets/{uuid}
     */
    getPersonalAsset: (uuid: string): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/me/assets/${uuid}`),

    /**
     * Create new asset
     * POST /api/me/assets
     */
    createPersonalAsset: (data: CreateAccountAssetRequestDto): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>('/me/assets', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Full update asset
     * PUT /api/me/assets/{uuid}
     */
    updatePersonalAsset: (uuid: string, data: CreateAccountAssetRequestDto): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/me/assets/${uuid}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update asset
     * PATCH /api/me/assets/{uuid}
     */
    patchPersonalAsset: (uuid: string, data: UpdateAccountAssetRequestDto): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/me/assets/${uuid}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Delete asset
     * DELETE /api/me/assets/{uuid}
     */
    deletePersonalAsset: (uuid: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/assets/${uuid}`, { method: 'DELETE' }),

    /**
     * Batch Operations (Personal)
     */

    /**
     * Batch update visibility
     * PATCH /api/me/assets/batch/visibility
     */
    batchUpdatePersonalVisibility: (data: BatchUpdateVisibilityRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/assets/batch/visibility', {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Batch delete assets
     * DELETE /api/me/assets/batch
     */
    batchDeletePersonalAssets: (data: BatchDeleteRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/assets/batch', {
            method: 'DELETE',
            body: JSON.stringify(data)
        }),

    /**
     * List all my categories (distinct)
     * GET /api/me/assets/categories
     */
    getPersonalCategories: (): Promise<string[]> =>
        httpClient<string[]>('/me/assets/categories'),

    /**
     * Organization Asset Library
     */

    /**
     * List organization assets (paginated)
     * GET /api/orgs/{org}/assets
     */
    getOrganizationAssets: (org: string, params: {
        page?: number;
        pageSize?: number;
        category?: string;
        visibility?: number;
        search?: string;
    } = {}): Promise<PagedResponse<AccountAssetDto>> => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
        if (params.category !== undefined) queryParams.append('category', params.category);
        if (params.visibility !== undefined) queryParams.append('visibility', params.visibility.toString());
        if (params.search !== undefined) queryParams.append('search', params.search);
        const queryString = queryParams.toString();
        return httpClient<PagedResponse<AccountAssetDto>>(`/orgs/${org}/assets${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get specific organization asset
     * GET /api/orgs/{org}/assets/{uuid}
     */
    getOrganizationAsset: (org: string, uuid: string): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/orgs/${org}/assets/${uuid}`),

    /**
     * Create new organization asset
     * POST /api/orgs/{org}/assets
     */
    createOrganizationAsset: (org: string, data: CreateAccountAssetRequestDto): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/orgs/${org}/assets`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Full update organization asset
     * PUT /api/orgs/{org}/assets/{uuid}
     */
    updateOrganizationAsset: (org: string, uuid: string, data: CreateAccountAssetRequestDto): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/orgs/${org}/assets/${uuid}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update organization asset
     * PATCH /api/orgs/{org}/assets/{uuid}
     */
    patchOrganizationAsset: (org: string, uuid: string, data: UpdateAccountAssetRequestDto): Promise<AccountAssetDto> =>
        httpClient<AccountAssetDto>(`/orgs/${org}/assets/${uuid}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Delete organization asset
     * DELETE /api/orgs/{org}/assets/{uuid}
     */
    deleteOrganizationAsset: (org: string, uuid: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/assets/${uuid}`, { method: 'DELETE' }),

    /**
     * Batch Operations (Organization)
     */

    /**
     * Batch update visibility
     * PATCH /api/orgs/{org}/assets/batch/visibility
     */
    batchUpdateOrganizationVisibility: (org: string, data: BatchUpdateVisibilityRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/assets/batch/visibility`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Batch delete assets
     * DELETE /api/orgs/{org}/assets/batch
     */
    batchDeleteOrganizationAssets: (org: string, data: BatchDeleteRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/assets/batch`, {
            method: 'DELETE',
            body: JSON.stringify(data)
        }),

    /**
     * List all organization categories (distinct)
     * GET /api/orgs/{org}/assets/categories
     */
    getOrganizationCategories: (org: string): Promise<string[]> =>
        httpClient<string[]>(`/orgs/${org}/assets/categories`)
};

/**
 * Public Asset Access
 * Returns 404 if asset is private, deleted, or belongs to suspended/banned account
 */
export const publicAssetsApi = {
    /**
     * Get public asset by UUID
     * GET /api/assets/{uuid}
     */
    getAsset: (uuid: string): Promise<PublicAssetDto> =>
        httpClient<PublicAssetDto>(`/assets/${uuid}`, { requiresAuth: false }),

    /**
     * Alias for static generator compatibility
     * GET /api/assets/{uuid}.json
     */
    getAssetJson: (uuid: string): Promise<PublicAssetDto> =>
        httpClient<PublicAssetDto>(`/assets/${uuid}.json`, { requiresAuth: false })
};

/**
 * Asset Lookup (Authenticated)
 * Cross-library asset lookup for authenticated users
 */
export const lookupApi = {
    /**
     * Lookup asset by UUID with permission checking
     * GET /api/lookup/{uuid}
     */
    lookupAsset: (uuid: string): Promise<LookupAssetDto> =>
        httpClient<LookupAssetDto>(`/lookup/${uuid}`)
};

/**
 * System Assets (Admin Only)
 * Manage system-wide global assets reserved for system use only
 */
export const systemAssetsApi = {
    /**
     * List all system assets
     * GET /api/admin/assets
     */
    getSystemAssets: (params?: { page?: number; pageSize?: number; category?: string; visibility?: number; search?: string }): Promise<PagedResponse<SystemAssetDto>> => {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
        if (params?.category !== undefined) queryParams.append('category', params.category);
        if (params?.visibility !== undefined) queryParams.append('visibility', params.visibility.toString());
        if (params?.search !== undefined) queryParams.append('search', params.search);
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
