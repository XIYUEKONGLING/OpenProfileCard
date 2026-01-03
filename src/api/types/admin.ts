import type {AccountType, AccountRole, AccountStatus} from './enums';

export interface UserAdminDto {
    Id: string;
    AccountName: string;
    Email: string;
    Type: AccountType;
    Role: AccountRole;
    Status: AccountStatus;
    CreatedAt: string;
    LastLogin: string;
}

export interface SystemSettingDto {
    Key: string;
    Value: string;
    Description?: string;
    ValueType?: string;
    UpdatedAt: string;
}
