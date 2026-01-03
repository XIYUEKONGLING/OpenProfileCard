import type { AssetDto } from './core';
import type { AccountStatus, MemberRole, Visibility, InvitationStatus } from './enums';

export interface OrganizationDto {
    Id: string;
    AccountName: string;
    DisplayName: string;
    Avatar: AssetDto;
    Status: AccountStatus;
    MyRole: MemberRole;
}

export interface OrganizationMemberDto {
    AccountId: string;
    AccountName: string;
    DisplayName: string;
    Avatar: AssetDto;
    Role: MemberRole;
    Title?: string;
    Visibility: Visibility;
    JoinedAt: string;
}

export interface OrganizationInvitationDto {
    Id: string;
    OrganizationId: string;
    OrganizationName: string;
    InviterName: string;
    InviteeName: string;
    Role: MemberRole;
    Status: InvitationStatus;
    CreatedAt: string;
}
