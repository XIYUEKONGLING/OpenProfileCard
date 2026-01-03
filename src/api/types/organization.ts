import type { AssetDto } from './core';
import type { AccountStatus, MemberRole, Visibility, InvitationStatus } from './enums';

export interface OrganizationDto {
    Id: string; // Guid
    AccountName: string;
    DisplayName: string;
    Avatar: AssetDto;
    Status: AccountStatus;
    MyRole: MemberRole;
}

export interface CreateOrganizationRequestDto {
    AccountName: string;
    DisplayName: string;
    Description?: string;
}

// --- Settings ---

export interface OrganizationSettingsDto {
    AllowFollowers: boolean;
    ShowFollowingList: boolean;
    ShowFollowersList: boolean;
    Visibility: Visibility;
    DefaultVisibility: Visibility;
    DefaultMemberVisibility: Visibility;
    AllowMemberInvite: boolean;
}

export interface UpdateOrganizationSettingsRequestDto {
    AllowFollowers?: boolean;
    ShowFollowingList?: boolean;
    ShowFollowersList?: boolean;
    Visibility?: Visibility;
    DefaultVisibility?: Visibility;
    DefaultMemberVisibility?: Visibility;
    AllowMemberInvite?: boolean;
}

// --- Members ---

export interface OrganizationMemberDto {
    AccountId: string; // Guid
    AccountName: string;
    DisplayName: string;
    Avatar: AssetDto;
    Role: MemberRole;
    Title?: string;
    Visibility: Visibility;
    JoinedAt: string; // DateTime
}

export interface MemberRoleDto {
    OrganizationId: string; // Guid
    OrganizationName: string;
    Role: MemberRole;
    Title?: string;
    Visibility: Visibility;
}

export interface UpdateMemberRequestDto {
    Role?: MemberRole;
    Title?: string;
    Visibility?: Visibility;
}

// --- Invitations ---

export interface OrganizationInvitationDto {
    Id: string; // Guid

    OrganizationId: string;
    OrganizationName: string;
    OrganizationAvatar: AssetDto;

    InviterId: string;
    InviterName: string;
    InviterAvatar: AssetDto;

    InviteeId: string;
    InviteeName: string;
    InviteeAvatar: AssetDto;

    Role: MemberRole;
    Title?: string;
    Status: InvitationStatus;
    CreatedAt: string; // DateTime
}

export interface InviteMemberRequestDto {
    Identity: string; // Username or Email
    Role: MemberRole;
    Title?: string;
}
