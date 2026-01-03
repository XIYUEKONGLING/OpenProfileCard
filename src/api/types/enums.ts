export type VerificationType = 'Registration' | 'Login' | 'ResetPassword' | 'VerifyEmail' | 'SudoMode';

export type Visibility = 'Public' | 'Private' | 'Protected' | 'MembersOnly';

export type MemberRole = 'Member' | 'Admin' | 'Owner' | 'Guest';

export type NotificationType = 'System' | 'Administrator' | 'Security' | 'Interaction';

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled' | 'Expired';

export type ContactType = 'Email' | 'Phone' | 'Message' | 'Address' | 'Link' | 'Other';

export type AssetType = 'Text' | 'Image' | 'Remote' | 'Style' | 'Identifier';

export type AccountType = 'Personal' | 'Organization' | 'Application' | 'System' | 'Service';

export type AccountStatus = 'Active' | 'PendingDeletion' | 'Banned' | 'Suspended' | 'Deactivated';

export type AccountRole = -1 | 0 | 1000; // Root | User | Admin

export const AccountRoleNames = {
    Root: -1 as AccountRole,
    User: 0 as AccountRole,
    Admin: 1000 as AccountRole
} as const;
