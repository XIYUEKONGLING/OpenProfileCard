import type { AssetDto, ServerInfoDto } from './core';

export interface ServerFeaturesDto {
    Email: boolean;
    Registration: boolean;
    SearchIndexing: boolean;
    EmailVerification: boolean;
    EmailAddVerification: boolean;
}

export interface SiteMetadataDto {
    SiteName: string;
    SiteDescription?: string;
    Copyright?: string;
    ContactEmail?: string;
    Logo: AssetDto;
    Favicon: AssetDto;
}

export interface UpdateSiteMetadataRequestDto {
    SiteName?: string;
    SiteDescription?: string;
    Copyright?: string;
    ContactEmail?: string;
    Logo?: AssetDto;
    Favicon?: AssetDto;
}

export interface ServerResponseDto {
    ServerInfo: ServerInfoDto;
    SiteMeta: SiteMetadataDto;
    Features: ServerFeaturesDto;
}
