// =============================================================================
// VerificationType
// =============================================================================

// export type VerificationType = 'Registration' | 'Login' | 'ResetPassword' | 'VerifyEmail' | 'SudoMode';

export const VerificationType = {
    /** Used when a new user is signing up. */
    Registration: 0,
    /** Used for Two-Factor Authentication during login. */
    Login: 1,
    /** Used when a user forgets their password. */
    ResetPassword: 2,
    /** Used to verify a new email address added to an account. */
    VerifyEmail: 3,
    /** Used for sensitive actions like deleting an account. */
    SudoMode: 4
} as const;

export type VerificationType = typeof VerificationType[keyof typeof VerificationType];

// =============================================================================
// Visibility
// =============================================================================

// export type Visibility = 'Public' | 'Private' | 'Protected' | 'MembersOnly';

export const Visibility = {
    Public: 0,
    Private: 1,
    Protected: 2,
    MembersOnly: 3
} as const;

export type Visibility = typeof Visibility[keyof typeof Visibility];

// =============================================================================
// MemberRole
// =============================================================================

// export type MemberRole = 'Member' | 'Admin' | 'Owner' | 'Guest';

/** Defines the role of an account within an organization. */
export const MemberRole = {
    /** Regular member with standard permissions. */
    Member: 0,
    /** Can manage content and other members. */
    Admin: 1,
    /** The creator or highest authority of the organization. */
    Owner: 2,
    /** Limited access, typically for external collaborators. */
    Guest: 3
} as const;

export type MemberRole = typeof MemberRole[keyof typeof MemberRole];

// =============================================================================
// NotificationType
// =============================================================================

// export type NotificationType = 'System' | 'Administrator' | 'Security' | 'Interaction';

export const NotificationType = {
    /** Platform announcements, maintenance alerts, or automated system events. */
    System: 0,
    /** Manual messages sent directly by an administrator to a specific user. */
    Administrator: 1,
    /** Account security events (Login alerts, Password changes, 2FA codes). */
    Security: 2,
    /**
     * All interactions involving other users or organizations (Follows, Invites, Mentions, Role updates).
     * Specific actions are handled via the notification's Data payload.
     */
    Interaction: 3
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// =============================================================================
// InvitationStatus
// =============================================================================

// export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled' | 'Expired';

export const InvitationStatus = {
    Pending: 0,
    Accepted: 1,
    Declined: 2,
    Cancelled: 3,
    Expired: 4
} as const;

export type InvitationStatus = typeof InvitationStatus[keyof typeof InvitationStatus];

// =============================================================================
// ContactType
// =============================================================================

// export type ContactType = 'Email' | 'Phone' | 'Message' | 'Address' | 'Link' | 'Other';

export const ContactType = {
    Email: 0,
    Phone: 1,
    /** (InstantMessage) WhatsApp, WeChat, Telegram */
    Message: 2,
    Address: 3,
    Link: 4,
    Other: 5
} as const;

export type ContactType = typeof ContactType[keyof typeof ContactType];

// =============================================================================
// AssetType
// =============================================================================

// export type AssetType = 'Text' | 'Image' | 'Remote' | 'Style' | 'Identifier';
// export type AssetType = typeof AssetType[keyof typeof AssetType];

export const AssetType = {
    Empty: 0,
    /** Plain text or Emojis. */
    Text: 1,
    /** Base64 encoded image string. */
    Image: 2,
    /** Direct URL to a remote resource (http/https). */
    Remote: 3,
    /** CSS classes (e.g., 'fa-solid fa-user', 'devicon-csharp-plain'). */
    Style: 4,
    /** Unique ID for an object storage resource (e.g., AWS S3 Key, Azure Blob ID). */
    Identifier: 5
} as const;

export type AssetType = typeof AssetType[keyof typeof AssetType];

// =============================================================================
// AccountType
// =============================================================================

// export type AccountType = 'Personal' | 'Organization' | 'Application' | 'System' | 'Service';

export const AccountType = {
    /** Represents a real human user. */
    Personal: 1,
    /** Represents a company, NGO, or community group. */
    Organization: 2,
    /** Represents a bot or an automated integration. Reserved. */
    Application: 3,
    /** Reserved for internal system operations. */
    System: 4,
    /** Reserved for internal system operations. */
    Service: 5
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

// =============================================================================
// AccountStatus
// =============================================================================

// export type AccountStatus = 'Active' | 'PendingDeletion' | 'Banned' | 'Suspended' | 'Deactivated';

export const AccountStatus = {
    /** Account is active and functioning normally. */
    Active: 0,
    /**
     * Account is marked for deletion. It enters a cooling-off period
     * where the owner can recover it, and the AccountName is not yet available for reuse.
     */
    PendingDeletion: 1,
    /** Account is permanently banned due to policy violations. */
    Banned: 2,
    /** Account is temporarily suspended (e.g., suspicious activity, pending investigation). */
    Suspended: 3,
    /** Account is deactivated by the user (Hidden but not deleted). */
    Deactivated: 4
} as const;

export type AccountStatus = typeof AccountStatus[keyof typeof AccountStatus];

// =============================================================================
// AccountRole
// =============================================================================

// export type AccountRole = -1 | 0 | 1000; // Root | User | Admin

/* 
export const AccountRoleNames = {
    Root: -1 as AccountRole,
    User: 0 as AccountRole,
    Admin: 1000 as AccountRole
} as const;
*/

export const AccountRole = {
    Root: -1,
    User: 0,
    Admin: 1000
} as const;

export type AccountRole = typeof AccountRole[keyof typeof AccountRole];
