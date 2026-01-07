import type { AssetDto } from './core';
import type { Visibility } from './enums';

// --- System Assets ---

export interface CreateSystemAssetRequestDto {
    Category?: string;
    Notes?: string;
    Asset: AssetDto;
    Visibility: Visibility;
}

export interface UpdateSystemAssetRequestDto {
    Category?: string;
    Notes?: string;
    Asset?: AssetDto;
    Visibility?: Visibility;
}

// --- Account Assets ---

export interface CreateAccountAssetRequestDto {
    Category?: string;
    Notes?: string;
    Asset: AssetDto;
    Visibility: Visibility;
}

export interface UpdateAccountAssetRequestDto {
    Category?: string;
    Notes?: string;
    Asset?: AssetDto;
    Visibility?: Visibility;
}

// --- Batch Operations ---

export interface BatchDeleteRequestDto {
    AssetIds: string[]; // Guid[]
}

export interface BatchUpdateVisibilityRequestDto {
    AssetIds: string[]; // Guid[]
    Visibility: Visibility;
}

// --- Lookup Asset ---

export interface LookupAssetDto {
    Id: string; // Guid
    AccountId?: string; // Guid (nullable)
    Category?: string;
    Notes?: string;
    Asset: AssetDto;
    Visibility: Visibility;
    CreatedAt: string; // DateTime
    UpdatedAt: string; // DateTime
}
