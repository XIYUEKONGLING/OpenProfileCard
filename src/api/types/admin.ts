import type {AccountType, AccountRole, AccountStatus, NotificationType} from './enums';

// --- Users ---

export interface UserAdminDto {
    Id: string; // Guid
    AccountName: string;
    Email: string;
    Type: AccountType;
    Role: AccountRole;
    Status: AccountStatus;
    CreatedAt: string; // DateTime
    LastLogin: string; // DateTime
}

export interface UserFilterDto {
    Search?: string;
    Status?: AccountStatus;
    Role?: AccountRole;
    Type?: AccountType;
}

export interface CreateUserRequestDto {
    AccountName: string;
    Email?: string;
    Password?: string;
    Type: AccountType;
    Role: AccountRole;
    DisplayName?: string;
}

export interface UpdateUserStatusRequestDto {
    Status: AccountStatus;
}

export interface UpdateUserRoleRequestDto {
    Role: AccountRole;
}

export interface AdminResetPasswordRequestDto {
    NewPassword: string;
}

export interface AdminUpdateEmailRequestDto {
    IsVerified?: boolean;
    IsPrimary?: boolean;
}

export interface CreateNotificationRequestDto {
    Title: string;
    Body: string;
    Type: NotificationType;
    Url?: string;
    Data?: string; // Optional JSON data payload.
}

// --- System Status ---

export interface SystemStatusDto {
    TotalAccountCount: number;
    AccountsByType: Record<AccountType, number>;
    AccountsByRole: Record<AccountRole, number>;
    AccountsByStatus: Record<AccountStatus, number>;
    
    TotalRefreshTokenCount: number;
    ActiveRefreshTokenCount: number;
    ExpiredRefreshTokenCount: number;
    
    TotalOrganizationCount: number;
    TotalPersonalProfileCount: number;
    TotalNotificationCount: number;
    
    ServerTimeUtc: string; // DateTime
}

// --- System Settings ---

export interface SystemSettingDto {
    Key: string;
    Value: string;
    Description?: string;
    ValueType?: string;
    UpdatedAt: string; // DateTime
}

export interface UpdateSystemSettingRequestDto {
    Value: string;
}
