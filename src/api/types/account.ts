import type { AccountType, AccountRole, AccountStatus, NotificationType, Visibility } from './enums';

// --- Account Info ---

export interface AccountDto {
    Id: string; // Guid
    AccountName: string;
    Email: string;
    Type: AccountType;
    Role: AccountRole;
    Status: AccountStatus;
    CreatedAt: string; // DateTime
}

export interface AccountPermissionsDto {
    AccountId: string; // Guid
    AccountName: string;
    Type: AccountType;
    Role: AccountRole;
}

// --- Emails ---

export interface AccountEmailDto {
    Id: string; // Guid
    Email: string;
    IsPrimary: boolean;
    IsVerified: boolean;
    CreatedAt: string; // DateTime
}

export interface AddEmailRequestDto {
    Email: string;
    Code: string;
}

export interface VerifyEmailRequestDto {
    Code: string;
}

// --- Settings ---

export interface PersonalSettingsDto {
    AllowFollowers: boolean;
    ShowFollowingList: boolean;
    ShowFollowersList: boolean;
    Visibility: Visibility;
    DefaultVisibility: Visibility;
    ShowLocalTime: boolean;
}

export interface UpdatePersonalSettingsRequestDto {
    AllowFollowers?: boolean;
    ShowFollowingList?: boolean;
    ShowFollowersList?: boolean;
    Visibility?: Visibility;
    DefaultVisibility?: Visibility;
    ShowLocalTime?: boolean;
}

export interface ChangePasswordRequestDto {
    OldPassword: string;
    NewPassword: string;
}

// --- Notifications ---

export interface NotificationDto {
    Id: string; // Guid
    Type: NotificationType;
    Title: string;
    Body: string;
    Url?: string;
    Data?: string; // JSON string
    IsRead: boolean;
    CreatedAt: string; // DateTime
}
