import type { AssetType, Visibility } from './enums';

export interface ServerInfoDto {
    Version: string;
    Server: string;
    Static: boolean;
    Dynamic: boolean;
}

export interface AssetDto {
    Type: AssetType;
    Value?: string;
    Tag?: string;
}

export interface SystemAssetDto {
    Id: string; // Guid
    Category?: string;
    Notes?: string;
    Asset: AssetDto;
    Visibility: Visibility;
    CreatedAt: string; // DateTime
    UpdatedAt: string; // DateTime
}

export interface AccountAssetDto {
    Id: string; // Guid
    AccountId: string; // Guid
    Category?: string;
    Notes?: string;
    Asset: AssetDto;
    Visibility: Visibility;
    CreatedAt: string; // DateTime
    UpdatedAt: string; // DateTime
}

export interface ApiResponse<T> {
    Status: boolean;
    Message: string | null;
    Data?: T;
}

export interface PagedResponse<T> extends ApiResponse<T[]> {
    PageNumber: number;
    PageSize: number;
    TotalPages: number;
    TotalRecords: number;
}

export interface MessageResponse {
    Message: string | null;
}

// Represents query parameters for pagination
export interface PaginationFilter {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
}
