import { httpClient } from '../client';
import type {
    OrganizationDto,
    CreateOrganizationRequestDto,
    OrganizationSettingsDto,
    UpdateOrganizationSettingsRequestDto,
    ProfileDto,
    UpdateProfileRequestDto,
    FollowCountsDto,
    FollowerDto,
    OrganizationMemberDto,
    MemberRoleDto,
    OrganizationPermissionsDto,
    InviteMemberRequestDto,
    UpdateMemberRequestDto,
    OrganizationInvitationDto,
    NotificationDto,
    PagedResponse,
    DeletionCountdownDto,
    MessageResponse,
    ProjectDto,
    SocialLinkDto,
    ContactMethodDto,
    GalleryItemDto,
    CertificateDto,
    SponsorshipItemDto,
    UpdateProjectRequestDto,
    UpdateSocialLinkRequestDto,
    UpdateContactMethodRequestDto,
    UpdateGalleryItemRequestDto,
    UpdateCertificateRequestDto,
    UpdateSponsorshipItemRequestDto
} from '../types';

/**
 * Organization Service
 * Handles organization management (dynamic / protected)
 */
export const organizationApi = {
    /**
     * Lifecycle
     */

    /**
     * List my organizations
     * GET /api/orgs
     */
    getOrganizations: (): Promise<OrganizationDto[]> =>
        httpClient<OrganizationDto[]>('/orgs'),

    /**
     * Create new organization
     * POST /api/orgs
     */
    createOrganization: (data: CreateOrganizationRequestDto): Promise<string> =>
        httpClient<string>('/orgs', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Request dissolution
     * DELETE /api/orgs/{org}
     */
    deleteOrganization: (org: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}`, { method: 'DELETE' }),

    /**
     * Restore organization
     * POST /api/orgs/{org}/restore
     */
    restoreOrganization: (org: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/restore`, { method: 'POST' }),

    /**
     * Get deletion countdown
     * GET /api/orgs/{org}/deletion-countdown
     */
    getDeletionCountdown: (org: string): Promise<DeletionCountdownDto> =>
        httpClient<DeletionCountdownDto>(`/orgs/${org}/deletion-countdown`),

    /**
     * Settings & Profile
     */

    /**
     * Org dashboard summary
     * GET /api/orgs/{org}
     */
    getOrganization: (org: string): Promise<OrganizationDto> =>
        httpClient<OrganizationDto>(`/orgs/${org}`),

    /**
     * Get org settings
     * GET /api/orgs/{org}/settings
     */
    getSettings: (org: string): Promise<OrganizationSettingsDto> =>
        httpClient<OrganizationSettingsDto>(`/orgs/${org}/settings`),

    /**
     * Full update settings
     * POST /api/orgs/{org}/settings
     */
    updateSettings: (org: string, data: UpdateOrganizationSettingsRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/settings`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update settings
     * PATCH /api/orgs/{org}/settings
     */
    patchSettings: (org: string, data: UpdateOrganizationSettingsRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/settings`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Get profile (Edit View)
     * GET /api/orgs/{org}/profile
     */
    getProfile: (org: string): Promise<ProfileDto> =>
        httpClient<ProfileDto>(`/orgs/${org}/profile`),

    /**
     * Full update profile
     * POST /api/orgs/{org}/profile
     */
    updateProfile: (org: string, data: UpdateProfileRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/profile`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update profile
     * PATCH /api/orgs/{org}/profile
     */
    patchProfile: (org: string, data: UpdateProfileRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/profile`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Get org follow counts
     * GET /api/orgs/{org}/follow-stats
     */
    getFollowStats: (org: string): Promise<FollowCountsDto> =>
        httpClient<FollowCountsDto>(`/orgs/${org}/follow-stats`),

    /**
     * List org followers
     * GET /api/orgs/{org}/followers
     */
    getFollowers: (org: string): Promise<FollowerDto[]> =>
        httpClient<FollowerDto[]>(`/orgs/${org}/followers`),

    /**
     * List org following
     * GET /api/orgs/{org}/following
     */
    getFollowing: (org: string): Promise<FollowerDto[]> =>
        httpClient<FollowerDto[]>(`/orgs/${org}/following`),

    /**
     * Member Management
     */

    /**
     * List all members
     * GET /api/orgs/{org}/members
     */
    getMembers: (org: string): Promise<OrganizationMemberDto[]> =>
        httpClient<OrganizationMemberDto[]>(`/orgs/${org}/members`),

    /**
     * Get my role
     * GET /api/orgs/{org}/members/me/role
     */
    getMyRole: (org: string): Promise<MemberRoleDto> =>
        httpClient<MemberRoleDto>(`/orgs/${org}/members/me/role`),

    /**
     * Get my permissions
     * GET /api/orgs/{org}/permissions
     */
    getPermissions: (org: string): Promise<OrganizationPermissionsDto> =>
        httpClient<OrganizationPermissionsDto>(`/orgs/${org}/permissions`),

    /**
     * Invite/add member
     * POST /api/orgs/{org}/members
     */
    inviteMember: (org: string, data: InviteMemberRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/members`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Update my info
     * PATCH /api/orgs/{org}/members/me
     */
    updateMyMemberInfo: (org: string, data: UpdateMemberRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/members/me`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Leave organization
     * DELETE /api/orgs/{org}/members/me
     */
    leaveOrganization: (org: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/members/me`, { method: 'DELETE' }),

    /**
     * Update member role
     * PATCH /api/orgs/{org}/members/{user}
     */
    updateMemberRole: (org: string, user: string, data: UpdateMemberRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/members/${user}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Kick member
     * DELETE /api/orgs/{org}/members/{user}
     */
    kickMember: (org: string, user: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/members/${user}`, { method: 'DELETE' }),

    /**
     * Invitations (Outgoing)
     */

    /**
     * List pending invites
     * GET /api/orgs/{org}/invitations
     */
    getInvitations: (org: string): Promise<OrganizationInvitationDto[]> =>
        httpClient<OrganizationInvitationDto[]>(`/orgs/${org}/invitations`),

    /**
     * Send invitation
     * POST /api/orgs/{org}/invitations
     */
    sendInvitation: (org: string, data: InviteMemberRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/invitations`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Revoke invitation
     * DELETE /api/orgs/{org}/invitations/{id}
     */
    revokeInvitation: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/invitations/${id}`, { method: 'DELETE' }),

    /**
     * Sub-Resources (Portfolio Management)
     */

    /**
     * GET /api/orgs/{org}/projects
     */
    getProjects: (org: string): Promise<ProjectDto[]> =>
        httpClient<ProjectDto[]>(`/orgs/${org}/projects`),

    /**
     * POST /api/orgs/{org}/projects (Full Update)
     */
    updateProject: (org: string, data: UpdateProjectRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/projects`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/orgs/{org}/projects/{id} (Partial Update)
     */
    patchProject: (org: string, id: string, data: UpdateProjectRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/projects/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/orgs/{org}/projects/{id}
     */
    deleteProject: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/projects/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/orgs/{org}/socials
     */
    getSocials: (org: string): Promise<SocialLinkDto[]> =>
        httpClient<SocialLinkDto[]>(`/orgs/${org}/socials`),

    /**
     * POST /api/orgs/{org}/socials (Full Update)
     */
    updateSocial: (org: string, data: UpdateSocialLinkRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/socials`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/orgs/{org}/socials/{id} (Partial Update)
     */
    patchSocial: (org: string, id: string, data: UpdateSocialLinkRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/socials/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/orgs/{org}/socials/{id}
     */
    deleteSocial: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/socials/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/orgs/{org}/contacts
     */
    getContacts: (org: string): Promise<ContactMethodDto[]> =>
        httpClient<ContactMethodDto[]>(`/orgs/${org}/contacts`),

    /**
     * POST /api/orgs/{org}/contacts (Full Update)
     */
    updateContact: (org: string, data: UpdateContactMethodRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/contacts`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/orgs/{org}/contacts/{id} (Partial Update)
     */
    patchContact: (org: string, id: string, data: UpdateContactMethodRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/contacts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/orgs/{org}/contacts/{id}
     */
    deleteContact: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/contacts/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/orgs/{org}/gallery
     */
    getGallery: (org: string): Promise<GalleryItemDto[]> =>
        httpClient<GalleryItemDto[]>(`/orgs/${org}/gallery`),

    /**
     * POST /api/orgs/{org}/gallery (Full Update)
     */
    updateGallery: (org: string, data: UpdateGalleryItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/gallery`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/orgs/{org}/gallery/{id} (Partial Update)
     */
    patchGallery: (org: string, id: string, data: UpdateGalleryItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/gallery/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/orgs/{org}/gallery/{id}
     */
    deleteGallery: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/gallery/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/orgs/{org}/certificates
     */
    getCertificates: (org: string): Promise<CertificateDto[]> =>
        httpClient<CertificateDto[]>(`/orgs/${org}/certificates`),

    /**
     * POST /api/orgs/{org}/certificates (Full Update)
     */
    updateCertificate: (org: string, data: UpdateCertificateRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/certificates`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/orgs/{org}/certificates/{id} (Partial Update)
     */
    patchCertificate: (org: string, id: string, data: UpdateCertificateRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/certificates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/orgs/{org}/certificates/{id}
     */
    deleteCertificate: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/certificates/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/orgs/{org}/sponsorships
     */
    getSponsorships: (org: string): Promise<SponsorshipItemDto[]> =>
        httpClient<SponsorshipItemDto[]>(`/orgs/${org}/sponsorships`),

    /**
     * POST /api/orgs/{org}/sponsorships (Full Update)
     */
    updateSponsorship: (org: string, data: UpdateSponsorshipItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/sponsorships`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/orgs/{org}/sponsorships/{id} (Partial Update)
     */
    patchSponsorship: (org: string, id: string, data: UpdateSponsorshipItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/sponsorships/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/orgs/{org}/sponsorships/{id}
     */
    deleteSponsorship: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/sponsorships/${id}`, { method: 'DELETE' }),

    /**
     * Notifications (Inbox)
     */

    /**
     * List notifications
     * GET /api/orgs/{org}/notifications
     */
    getNotifications: (org: string, params: { page?: number; unreadOnly?: boolean } = {}): Promise<PagedResponse<NotificationDto>> => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly.toString());
        const queryString = queryParams.toString();
        return httpClient<PagedResponse<NotificationDto>>(`/orgs/${org}/notifications${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get total unread
     * GET /api/orgs/{org}/notifications/unread-count
     */
    getUnreadCount: (org: string): Promise<number> =>
        httpClient<number>(`/orgs/${org}/notifications/unread-count`),

    /**
     * Mark as read
     * PATCH /api/orgs/{org}/notifications/{id}/read
     */
    markAsRead: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/notifications/${id}/read`, { method: 'PATCH' }),

    /**
     * Mark all read
     * POST /api/orgs/{org}/notifications/read-all
     */
    markAllAsRead: (org: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/notifications/read-all`, { method: 'POST' }),

    /**
     * Delete notification
     * DELETE /api/orgs/{org}/notifications/{id}
     */
    deleteNotification: (org: string, id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/notifications/${id}`, { method: 'DELETE' }),

    /**
     * Delete all read
     * DELETE /api/orgs/{org}/notifications
     */
    deleteReadNotifications: (org: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/orgs/${org}/notifications`, { method: 'DELETE' })
};
