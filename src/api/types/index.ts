export * from './enums';
export * from './core';
export * from './auth';
export * from './account';
export * from './profile';
export * from './organization';
export * from './admin';

import type {ServerInfoDto, AssetDto} from './core';

export interface SiteMetadataDto {
    SiteName: string;
    SiteDescription?: string;
    Copyright?: string;
    ContactEmail?: string;
    Logo: AssetDto;
    Favicon: AssetDto;
}

export interface ServerResponseDto {
    ServerInfo: ServerInfoDto;
    SiteMeta: SiteMetadataDto;
}
