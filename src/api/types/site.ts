import type { AssetDto, ServerInfoDto } from './core';

export interface ServerFeaturesDto {
    /** Indicates if the SMTP Email service is configured and enabled */
    Email: boolean;
    /** Indicates if new user registration is currently allowed */
    Registration: boolean;
    /** Indicates if the site allows search engine indexing */
    SearchIndexing: boolean;
    /** Indicates if the server requires email verification before login */
    EmailVerification: boolean;
}

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
    Features: ServerFeaturesDto;
}
