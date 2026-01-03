import type {AccountType, AccountRole, AccountStatus, NotificationType} from './enums';

export interface AccountDto {
    Id: string;
    AccountName: string;
    Email: string;
    Type: AccountType;
    Role: AccountRole;
    Status: AccountStatus;
    CreatedAt: string;
}

export interface AccountPermissionsDto {
    AccountId: string;
    AccountName: string;
    Type: AccountType;
    Role: AccountRole;
}

export interface NotificationDto {
    Id: string;
    Type: NotificationType;
    Title: string;
    Body: string;
    Url?: string;
    Data?: string;
    IsRead: boolean;
    CreatedAt: string;
}
