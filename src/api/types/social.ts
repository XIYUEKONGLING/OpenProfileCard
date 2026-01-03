import type { AssetDto } from './core';

export interface FollowerDto {
    AccountId: string; // Guid
    AccountName: string;
    DisplayName: string;
    Avatar: AssetDto;
    Description?: string;
}

export interface BlockDto {
    AccountId: string; // Guid
    AccountName: string;
    DisplayName: string;
    BlockedAt: string; // DateTime
}

export interface FollowStatusDto {
    IsFollowing: boolean;
    IsFollowedBy: boolean;
    IsBlocking: boolean;
    IsBlockedBy: boolean;
}
