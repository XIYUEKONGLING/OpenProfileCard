import { httpClient } from '../client';
import type {
    ProfileDto,
    PublicOrganizationMembershipDto,
    OrganizationMemberDto,
    FollowerDto,
    ProfilePrivacyDto,
    AccountCreatedDateDto,
    WorkExperienceDto,
    EducationExperienceDto,
    ProjectDto,
    SocialLinkDto,
    ContactMethodDto,
    GalleryItemDto,
    CertificateDto,
    SponsorshipItemDto,
    FollowStatusDto,
    MessageResponse
} from '../types';

/**
 * Public Profile Service
 * Handles public profile data retrieval (read-only, static compatible)
 */
export const profileApi = {
    /**
     * Get profile info
     * GET /api/profiles/{profile}
     */
    getProfile: (profile: string): Promise<ProfileDto> =>
        httpClient<ProfileDto>(`/profiles/${profile}`, { requiresAuth: false }),

    /**
     * Get public organizations
     * GET /api/profiles/{profile}/memberships
     */
    getMemberships: (profile: string): Promise<PublicOrganizationMembershipDto[]> =>
        httpClient<PublicOrganizationMembershipDto[]>(`/profiles/${profile}/memberships`, { requiresAuth: false }),

    /**
     * Get public members (for organizations)
     * GET /api/profiles/{profile}/members
     */
    getMembers: (profile: string): Promise<OrganizationMemberDto[]> =>
        httpClient<OrganizationMemberDto[]>(`/profiles/${profile}/members`, { requiresAuth: false }),

    /**
     * Get followers list
     * GET /api/profiles/{profile}/followers
     */
    getFollowers: (profile: string): Promise<FollowerDto[]> =>
        httpClient<FollowerDto[]>(`/profiles/${profile}/followers`, { requiresAuth: false }),

    /**
     * Get following list
     * GET /api/profiles/{profile}/following
     */
    getFollowing: (profile: string): Promise<FollowerDto[]> =>
        httpClient<FollowerDto[]>(`/profiles/${profile}/following`, { requiresAuth: false }),

    /**
     * Get list privacy status
     * GET /api/profiles/{profile}/privacy
     */
    getPrivacy: (profile: string): Promise<ProfilePrivacyDto> =>
        httpClient<ProfilePrivacyDto>(`/profiles/${profile}/privacy`, { requiresAuth: false }),

    /**
     * Get creation date
     * GET /api/profiles/{profile}/created-at
     */
    getCreatedAt: (profile: string): Promise<AccountCreatedDateDto> =>
        httpClient<AccountCreatedDateDto>(`/profiles/${profile}/created-at`, { requiresAuth: false }),

    /**
     * Get work experience
     * GET /api/profiles/{profile}/work
     */
    getWork: (profile: string): Promise<WorkExperienceDto[]> =>
        httpClient<WorkExperienceDto[]>(`/profiles/${profile}/work`, { requiresAuth: false }),

    /**
     * Get education experience
     * GET /api/profiles/{profile}/education
     */
    getEducation: (profile: string): Promise<EducationExperienceDto[]> =>
        httpClient<EducationExperienceDto[]>(`/profiles/${profile}/education`, { requiresAuth: false }),

    /**
     * Get projects
     * GET /api/profiles/{profile}/projects
     */
    getProjects: (profile: string): Promise<ProjectDto[]> =>
        httpClient<ProjectDto[]>(`/profiles/${profile}/projects`, { requiresAuth: false }),

    /**
     * Get social links
     * GET /api/profiles/{profile}/socials
     */
    getSocials: (profile: string): Promise<SocialLinkDto[]> =>
        httpClient<SocialLinkDto[]>(`/profiles/${profile}/socials`, { requiresAuth: false }),

    /**
     * Get contact methods
     * GET /api/profiles/{profile}/contacts
     */
    getContacts: (profile: string): Promise<ContactMethodDto[]> =>
        httpClient<ContactMethodDto[]>(`/profiles/${profile}/contacts`, { requiresAuth: false }),

    /**
     * Get gallery items
     * GET /api/profiles/{profile}/gallery
     */
    getGallery: (profile: string): Promise<GalleryItemDto[]> =>
        httpClient<GalleryItemDto[]>(`/profiles/${profile}/gallery`, { requiresAuth: false }),

    /**
     * Get certificates
     * GET /api/profiles/{profile}/certificates
     */
    getCertificates: (profile: string): Promise<CertificateDto[]> =>
        httpClient<CertificateDto[]>(`/profiles/${profile}/certificates`, { requiresAuth: false }),

    /**
     * Get sponsorships
     * GET /api/profiles/{profile}/sponsorships
     */
    getSponsorships: (profile: string): Promise<SponsorshipItemDto[]> =>
        httpClient<SponsorshipItemDto[]>(`/profiles/${profile}/sponsorships`, { requiresAuth: false }),

    /**
     * Social actions
     */

    /**
     * Follow target user/org
     * POST /api/profiles/{profile}/follow
     */
    follow: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/follow`, { method: 'POST' }),

    /**
     * Unfollow
     * DELETE /api/profiles/{profile}/follow
     */
    unfollow: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/follow`, { method: 'DELETE' }),

    /**
     * Check follow status
     * GET /api/profiles/{profile}/follow
     */
    getFollowStatus: (profile: string): Promise<FollowStatusDto> =>
        httpClient<FollowStatusDto>(`/profiles/${profile}/follow`, { requiresAuth: false }),

    /**
     * Block target
     * POST /api/profiles/{profile}/block
     */
    block: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/block`, { method: 'POST' }),

    /**
     * Unblock target
     * DELETE /api/profiles/{profile}/block
     */
    unblock: (profile: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/profiles/${profile}/block`, { method: 'DELETE' })
};
