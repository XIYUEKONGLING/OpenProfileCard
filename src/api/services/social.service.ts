import { httpClient } from '../client';
import type {
    FollowStatusDto,
    MessageResponse
} from '../types';

/**
 * Social Actions Service
 * Handles follow/block actions. Operator must be in Active status.
 */
export const socialApi = {
    /**
     * Follow target user/org
     * POST /api/profiles/{profile}/follow
     */
    follow: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/follow`, {
            method: 'POST'
        }),

    /**
     * Unfollow
     * DELETE /api/profiles/{profile}/follow
     */
    unfollow: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/follow`, {
            method: 'DELETE'
        }),

    /**
     * Check follow status
     * GET /api/profiles/{profile}/follow
     */
    getFollowStatus: (profile: string): Promise<FollowStatusDto> =>
        httpClient<FollowStatusDto>(`/profiles/${profile}/follow`),

    /**
     * Block target
     * POST /api/profiles/{profile}/block
     */
    block: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/block`, {
            method: 'POST'
        }),

    /**
     * Unblock target
     * DELETE /api/profiles/{profile}/block
     */
    unblock: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/block`, {
            method: 'DELETE'
        })
};
