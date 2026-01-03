import type {AssetType} from './enums';

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
