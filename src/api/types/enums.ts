export type VerificationType = 'Registration' | 'Login' | 'ResetPassword' | 'VerifyEmail' | 'SudoMode';

export type Visibility = 'Public' | 'Private' | 'Protected' | 'MembersOnly';

export type MemberRole = 'Member' | 'Admin' | 'Owner' | 'Guest';

export type NotificationType = 'System' | 'Administrator' | 'Security' | 'Interaction';

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled' | 'Expired';

export type ContactType = 'Email' | 'Phone' | 'Message' | 'Address' | 'Link' | 'Other';

// export type AssetType = 'Text' | 'Image' | 'Remote' | 'Style' | 'Identifier';

export type AssetType = typeof AssetType[keyof typeof AssetType];

export const AssetType = {
    Empty: 0,
    Text: 1,
    Image: 2,
    Remote: 3,
    Style: 4,
    Identifier: 5
} as const;


// export type AccountType = 'Personal' | 'Organization' | 'Application' | 'System' | 'Service';

export const AccountType = {
    Personal: 1,
    Organization: 2,
    Application: 3,
    System: 4,
    Service: 5
} as const;
export type AccountType = typeof AccountType[keyof typeof AccountType];

// export type AccountStatus = 'Active' | 'PendingDeletion' | 'Banned' | 'Suspended' | 'Deactivated';

export const AccountStatus = {
    Active: 0,
    PendingDeletion: 1,
    Banned: 2,
    Suspended: 3,
    Deactivated: 4
} as const;
export type AccountStatus = typeof AccountStatus[keyof typeof AccountStatus];

export type AccountRole = -1 | 0 | 1000; // Root | User | Admin

export const AccountRoleNames = {
    Root: -1 as AccountRole,
    User: 0 as AccountRole,
    Admin: 1000 as AccountRole
} as const;
