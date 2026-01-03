import type {AssetDto} from './core';
import type {AccountType, AccountStatus, Visibility, ContactType} from './enums';

export interface ProfileDto {
    Id: string;
    AccountName: string;
    Type: AccountType;
    Status: AccountStatus;
    DisplayName?: string;
    Avatar?: AssetDto;
    Background?: AssetDto;
    Pronouns?: string;
    Description?: string;
    Content?: string;
    Location?: string;
    TimeZone?: string;
    Website?: string;
    JobTitle?: string;
    CurrentCompany?: string;
    CurrentSchool?: string;
    Birthday?: string;
    FoundedDate?: string;
    FollowersCount: number;
    FollowingCount: number;
}

export interface WorkExperienceDto {
    Id: string;
    CompanyName: string;
    Position: string;
    StartDate?: string;
    EndDate?: string;
    Description?: string;
    Logo: AssetDto;
}

export interface ProjectDto {
    Id: string;
    Name: string;
    Summary?: string;
    Url?: string;
    Logo: AssetDto;
    Visibility: Visibility;
}

export interface ContactMethodDto {
    Id: string;
    Type: ContactType;
    Label: string;
    Value: string;
    Icon: AssetDto;
    Visibility: Visibility;
}
