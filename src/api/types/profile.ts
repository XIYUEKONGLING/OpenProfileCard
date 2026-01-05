import type { AssetDto } from './core';
import type {AccountType, AccountStatus, Visibility, MemberRole, ContactType} from './enums';

// --- Main Profile ---

export interface ProfileDto {
    Id: string; // Guid
    AccountName: string;
    Type: AccountType;
    Status: AccountStatus;

    // Basic
    DisplayName?: string;
    Avatar?: AssetDto;
    Background?: AssetDto;
    Pronouns?: string;

    // Detailed
    Description?: string;
    Content?: string; // Markdown
    Location?: string;
    TimeZone?: string;
    Website?: string;

    // Personal
    JobTitle?: string;
    CurrentCompany?: string;
    CurrentSchool?: string;
    Birthday?: string; // DateOnly (string)

    // Organization
    FoundedDate?: string; // DateOnly (string)

    // Stats
    FollowersCount: number;
    FollowingCount: number;
}

export interface ProfilePrivacyDto {
    ShowFollowers: boolean;
    ShowFollowing: boolean;
}

export interface AccountCreatedDateDto {
    CreatedDate: string; // DateOnly (string)
}

export interface UpdateProfileRequestDto {
    DisplayName?: string;
    Description?: string;
    Content?: string;
    Location?: string;
    TimeZone?: string;
    Website?: string;
    Avatar?: AssetDto;
    Background?: AssetDto;
    Pronouns?: string;
    JobTitle?: string;
    CurrentCompany?: string;
    CurrentSchool?: string;
    Birthday?: string;
    FoundedDate?: string;
}

export interface PublicOrganizationMembershipDto {
    OrganizationId: string; // Guid
    AccountName: string;
    DisplayName: string;
    Avatar: AssetDto;
    Role: MemberRole;
    Title?: string;
    JoinedAt: string; // DateTime
}

// --- Sub-Resources: Work ---

export interface WorkExperienceDto {
    Id: string; // Guid
    CompanyName: string;
    Position: string;
    StartDate?: string; // DateOnly
    EndDate?: string; // DateOnly
    Description?: string;
    Logo: AssetDto;
}

export interface UpdateWorkExperienceRequestDto {
    CompanyName: string;
    Position?: string;
    StartDate?: string;
    EndDate?: string;
    Description?: string;
    Logo?: AssetDto;
}

// --- Sub-Resources: Education ---

export interface EducationExperienceDto {
    Id: string; // Guid
    SchoolName: string;
    Degree?: string;
    Major?: string;
    StartDate?: string; // DateOnly
    EndDate?: string; // DateOnly
    Logo: AssetDto;
}

export interface UpdateEducationExperienceRequestDto {
    SchoolName: string;
    Degree?: string;
    Major?: string;
    StartDate?: string;
    EndDate?: string;
    Logo?: AssetDto;
}

// --- Sub-Resources: Projects ---

export interface ProjectDto {
    Id: string; // Guid
    Name: string;
    Summary?: string;
    Content?: string;
    Url?: string;
    Logo: AssetDto;
    DisplayOrder: number;
    Visibility: Visibility;
}

export interface UpdateProjectRequestDto {
    Name?: string;
    Summary?: string;
    Content?: string;
    Url?: string;
    Logo?: AssetDto;
    DisplayOrder?: number;
    Visibility?: Visibility;
}

// --- Sub-Resources: Social Links ---

export interface SocialLinkDto {
    Id: string; // Guid
    Platform: string;
    Url: string;
    Icon: AssetDto;
}

export interface UpdateSocialLinkRequestDto {
    Platform?: string;
    Url?: string;
    Icon?: AssetDto;
}

// --- Sub-Resources: Gallery ---

export interface GalleryItemDto {
    Id: string; // Guid
    Image: AssetDto;
    Caption?: string;
    ActionUrl?: string;
    DisplayOrder: number;
    Visibility: Visibility;
}

export interface UpdateGalleryItemRequestDto {
    Image?: AssetDto;
    Caption?: string;
    ActionUrl?: string;
    DisplayOrder?: number;
    Visibility?: Visibility;
}

// --- Sub-Resources: Certificates ---

export interface CertificateDto {
    Id: string; // Guid
    Type: string;
    Name: string;
    Fingerprint: string;
    Email?: string;
    Content?: string;
    CreatedAt?: string; // DateTime
    ExpiresAt?: string; // DateTime
    Visibility: Visibility;
}

export interface UpdateCertificateRequestDto {
    Type: string;
    Name: string;
    Fingerprint: string;
    Email?: string;
    Content?: string;
    CreatedAt?: string;
    ExpiresAt?: string;
    Visibility?: Visibility;
}

// --- Sub-Resources: Sponsorships ---

export interface SponsorshipItemDto {
    Id: string; // Guid
    Platform: string;
    Url?: string;
    Icon: AssetDto;
    QrCode: AssetDto;
    DisplayOrder: number;
    Visibility: Visibility;
}

export interface UpdateSponsorshipItemRequestDto {
    Platform: string;
    Url?: string;
    Icon?: AssetDto;
    QrCode?: AssetDto;
    DisplayOrder?: number;
    Visibility?: Visibility;
}


export interface ContactMethodDto {
    Id: string; // Guid
    Type: ContactType;
    Label: string;
    Value: string;
    Icon: AssetDto;
    Image: AssetDto;
    Visibility: Visibility;
}

export interface UpdateContactMethodRequestDto {
    Type?: ContactType;
    Label?: string;
    Value: string;
    Icon?: AssetDto;
    Image?: AssetDto;
    Visibility?: Visibility;
}
