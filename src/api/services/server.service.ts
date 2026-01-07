import { httpClient } from '../client';
import type {
    ServerResponseDto,
    ServerInfoDto,
    SiteMetadataDto,
    ServerFeaturesDto
} from '../types';

/**
 * Server & Meta Service
 * Provides information about the server instance, enabled features, and site branding.
 * All endpoints work in both dynamic and static modes.
 */
export const serverApi = {
    /**
     * Get combined server info, features, and site metadata
     * GET /api
     * Static File: api/index.json
     */
    getServer: (): Promise<ServerResponseDto> =>
        httpClient<ServerResponseDto>('/', { requiresAuth: false }),

    /**
     * Get standalone server version and mode
     * GET /api/info
     * Static File: api/info.json
     */
    getInfo: (): Promise<ServerInfoDto> =>
        httpClient<ServerInfoDto>('/info', { requiresAuth: false }),

    /**
     * Get standalone site branding metadata
     * GET /api/meta
     * Static File: api/meta.json
     */
    getMeta: (): Promise<SiteMetadataDto> =>
        httpClient<SiteMetadataDto>('/meta', { requiresAuth: false }),

    /**
     * Get server feature flags (Email/Registration status)
     * GET /api/features
     * Static File: api/features.json
     */
    getFeatures: (): Promise<ServerFeaturesDto> =>
        httpClient<ServerFeaturesDto>('/features', { requiresAuth: false })
};
