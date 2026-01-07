import { httpClient } from '../client';
import type {
    AccountDto,
    AccountPermissionsDto,
    AccountEmailDto,
    AddEmailRequestDto,
    VerifyEmailRequestDto,
    ChangePasswordRequestDto,
    BlockDto,
    FollowCountsDto,
    FollowerDto,
    PersonalSettingsDto,
    UpdatePersonalSettingsRequestDto,
    ProfileDto,
    UpdateProfileRequestDto,
    OrganizationInvitationDto,
    NotificationDto,
    PagedResponse,
    DeletionCountdownDto,
    MessageResponse,
    WorkExperienceDto,
    EducationExperienceDto,
    ProjectDto,
    SocialLinkDto,
    ContactMethodDto,
    GalleryItemDto,
    CertificateDto,
    SponsorshipItemDto,
    UpdateWorkExperienceRequestDto,
    UpdateEducationExperienceRequestDto,
    UpdateProjectRequestDto,
    UpdateSocialLinkRequestDto,
    UpdateContactMethodRequestDto,
    UpdateGalleryItemRequestDto,
    UpdateCertificateRequestDto,
    UpdateSponsorshipItemRequestDto
} from '../types';

/**
 * Account Service
 * Handles personal account management (dynamic / protected)
 */
export const accountApi = {
    /**
     * Lifecycle
     */

    /**
     * Request account deletion
     * DELETE /api/me
     */
    deleteAccount: (): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me', { method: 'DELETE' }),

    /**
     * Restore account
     * POST /api/me/restore
     */
    restoreAccount: (): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/restore', { method: 'POST' }),

    /**
     * Get deletion countdown
     * GET /api/me/deletion-countdown
     */
    getDeletionCountdown: (): Promise<DeletionCountdownDto> =>
        httpClient<DeletionCountdownDto>('/me/deletion-countdown'),

    /**
     * Account & Security
     */

    /**
     * Get full account details
     * GET /api/me
     */
    getAccount: (): Promise<AccountDto> =>
        httpClient<AccountDto>('/me'),

    /**
     * Get role and type
     * GET /api/me/permissions
     */
    getPermissions: (): Promise<AccountPermissionsDto> =>
        httpClient<AccountPermissionsDto>('/me/permissions'),

    /**
     * List all emails
     * GET /api/me/emails
     */
    getEmails: (): Promise<AccountEmailDto[]> =>
        httpClient<AccountEmailDto[]>('/me/emails'),

    /**
     * Add new email
     * POST /api/me/emails
     */
    addEmail: (data: AddEmailRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/emails', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Set as primary
     * POST /api/me/emails/{email}/primary
     */
    setPrimaryEmail: (email: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/emails/${encodeURIComponent(email)}/primary`, { method: 'POST' }),

    /**
     * Verify email with code
     * POST /api/me/emails/{email}/verify
     */
    verifyEmail: (email: string, data: VerifyEmailRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/emails/${encodeURIComponent(email)}/verify`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Remove email
     * DELETE /api/me/emails/{email}
     */
    removeEmail: (email: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/emails/${encodeURIComponent(email)}`, { method: 'DELETE' }),

    /**
     * Change password
     * POST /api/me/password
     */
    changePassword: (data: ChangePasswordRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/password', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * List blocked users
     * GET /api/me/blocks
     */
    getBlocks: (): Promise<BlockDto[]> =>
        httpClient<BlockDto[]>('/me/blocks'),

    /**
     * Get follow counts
     * GET /api/me/follow-stats
     */
    getFollowStats: (): Promise<FollowCountsDto> =>
        httpClient<FollowCountsDto>('/me/follow-stats'),

    /**
     * List my followers
     * GET /api/me/followers
     */
    getFollowers: (): Promise<FollowerDto[]> =>
        httpClient<FollowerDto[]>('/me/followers'),

    /**
     * List my following
     * GET /api/me/following
     */
    getFollowing: (): Promise<FollowerDto[]> =>
        httpClient<FollowerDto[]>('/me/following'),

    /**
     * Settings & Profile
     */

    /**
     * Get personal settings
     * GET /api/me/settings
     */
    getSettings: (): Promise<PersonalSettingsDto> =>
        httpClient<PersonalSettingsDto>('/me/settings'),

    /**
     * Full update settings
     * POST /api/me/settings
     */
    updateSettings: (data: UpdatePersonalSettingsRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/settings', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update settings
     * PATCH /api/me/settings
     */
    patchSettings: (data: UpdatePersonalSettingsRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/settings', {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Get profile (Edit View)
     * GET /api/me/profile
     */
    getProfile: (): Promise<ProfileDto> =>
        httpClient<ProfileDto>('/me/profile'),

    /**
     * Full update profile
     * POST /api/me/profile
     */
    updateProfile: (data: UpdateProfileRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/profile', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Partial update profile
     * PATCH /api/me/profile
     */
    patchProfile: (data: UpdateProfileRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/profile', {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Invitations (Incoming)
     */

    /**
     * List invitations
     * GET /api/me/invitations
     */
    getInvitations: (): Promise<OrganizationInvitationDto[]> =>
        httpClient<OrganizationInvitationDto[]>('/me/invitations'),

    /**
     * Accept invitation
     * POST /api/me/invitations/{id}/accept
     */
    acceptInvitation: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/invitations/${id}/accept`, { method: 'POST' }),

    /**
     * Decline invitation
     * POST /api/me/invitations/{id}/decline
     */
    declineInvitation: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/invitations/${id}/decline`, { method: 'POST' }),

    /**
     * Sub-Resources (Management)
     */

    /**
     * GET /api/me/work
     */
    getWork: (): Promise<WorkExperienceDto[]> =>
        httpClient<WorkExperienceDto[]>('/me/work'),

    /**
     * POST /api/me/work (Full Update)
     */
    updateWork: (data: UpdateWorkExperienceRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/work', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/work/{id} (Partial Update)
     */
    patchWork: (id: string, data: UpdateWorkExperienceRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/work/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/work/{id}
     */
    deleteWork: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/work/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/education
     */
    getEducation: (): Promise<EducationExperienceDto[]> =>
        httpClient<EducationExperienceDto[]>('/me/education'),

    /**
     * POST /api/me/education (Full Update)
     */
    updateEducation: (data: UpdateEducationExperienceRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/education', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/education/{id} (Partial Update)
     */
    patchEducation: (id: string, data: UpdateEducationExperienceRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/education/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/education/{id}
     */
    deleteEducation: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/education/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/projects
     */
    getProjects: (): Promise<ProjectDto[]> =>
        httpClient<ProjectDto[]>('/me/projects'),

    /**
     * POST /api/me/projects (Full Update)
     */
    updateProject: (data: UpdateProjectRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/projects/{id} (Partial Update)
     */
    patchProject: (id: string, data: UpdateProjectRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/projects/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/projects/{id}
     */
    deleteProject: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/projects/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/socials
     */
    getSocials: (): Promise<SocialLinkDto[]> =>
        httpClient<SocialLinkDto[]>('/me/socials'),

    /**
     * POST /api/me/socials (Full Update)
     */
    updateSocial: (data: UpdateSocialLinkRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/socials', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/socials/{id} (Partial Update)
     */
    patchSocial: (id: string, data: UpdateSocialLinkRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/socials/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/socials/{id}
     */
    deleteSocial: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/socials/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/contacts
     */
    getContacts: (): Promise<ContactMethodDto[]> =>
        httpClient<ContactMethodDto[]>('/me/contacts'),

    /**
     * POST /api/me/contacts (Full Update)
     */
    updateContact: (data: UpdateContactMethodRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/contacts', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/contacts/{id} (Partial Update)
     */
    patchContact: (id: string, data: UpdateContactMethodRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/contacts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/contacts/{id}
     */
    deleteContact: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/contacts/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/gallery
     */
    getGallery: (): Promise<GalleryItemDto[]> =>
        httpClient<GalleryItemDto[]>('/me/gallery'),

    /**
     * POST /api/me/gallery (Full Update)
     */
    updateGallery: (data: UpdateGalleryItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/gallery', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/gallery/{id} (Partial Update)
     */
    patchGallery: (id: string, data: UpdateGalleryItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/gallery/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/gallery/{id}
     */
    deleteGallery: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/gallery/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/certificates
     */
    getCertificates: (): Promise<CertificateDto[]> =>
        httpClient<CertificateDto[]>('/me/certificates'),

    /**
     * POST /api/me/certificates (Full Update)
     */
    updateCertificate: (data: UpdateCertificateRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/certificates', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/certificates/{id} (Partial Update)
     */
    patchCertificate: (id: string, data: UpdateCertificateRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/certificates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/certificates/{id}
     */
    deleteCertificate: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/certificates/${id}`, { method: 'DELETE' }),

    /**
     * GET /api/me/sponsorships
     */
    getSponsorships: (): Promise<SponsorshipItemDto[]> =>
        httpClient<SponsorshipItemDto[]>('/me/sponsorships'),

    /**
     * POST /api/me/sponsorships (Full Update)
     */
    updateSponsorship: (data: UpdateSponsorshipItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/sponsorships', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * PATCH /api/me/sponsorships/{id} (Partial Update)
     */
    patchSponsorship: (id: string, data: UpdateSponsorshipItemRequestDto): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/sponsorships/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * DELETE /api/me/sponsorships/{id}
     */
    deleteSponsorship: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/sponsorships/${id}`, { method: 'DELETE' }),

    /**
     * Notifications (Inbox)
     */

    /**
     * List notifications
     * GET /api/me/notifications
     */
    getNotifications: (params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}): Promise<PagedResponse<NotificationDto>> => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
        if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly.toString());
        const queryString = queryParams.toString();
        return httpClient<PagedResponse<NotificationDto>>(`/me/notifications${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get total unread
     * GET /api/me/notifications/unread-count
     */
    getUnreadCount: (): Promise<number> =>
        httpClient<number>('/me/notifications/unread-count'),

    /**
     * Mark as read
     * PATCH /api/me/notifications/{id}/read
     */
    markAsRead: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/notifications/${id}/read`, { method: 'PATCH' }),

    /**
     * Mark all read
     * POST /api/me/notifications/read-all
     */
    markAllAsRead: (): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/notifications/read-all', { method: 'POST' }),

    /**
     * Delete notification
     * DELETE /api/me/notifications/{id}
     */
    deleteNotification: (id: string): Promise<MessageResponse> =>
        httpClient<MessageResponse>(`/me/notifications/${id}`, { method: 'DELETE' }),

    /**
     * Delete all read
     * DELETE /api/me/notifications
     */
    deleteReadNotifications: (): Promise<MessageResponse> =>
        httpClient<MessageResponse>('/me/notifications', { method: 'DELETE' })
};
