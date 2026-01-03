import type {VerificationType} from './enums';

export interface TokenResponseDto {
    AccessToken: string;
    RefreshToken?: string;
    ExpiresAt: string;
}

export interface LoginRequestDto {
    Login: string;
    Password: string;
}

export interface RegisterRequestDto {
    AccountName: string;
    Email: string;
    Password: string;
    Code?: string;
}

export interface AuthConfigDto {
    RegistrationRequiresEmail: boolean;
    AllowRegistration: boolean;
}

export interface SendCodeRequestDto {
    Email: string;
    Type: VerificationType;
}
