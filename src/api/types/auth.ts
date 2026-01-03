import type { VerificationType } from './enums';

export interface TokenResponseDto {
    AccessToken: string;
    RefreshToken?: string;
    ExpiresAt: string; // DateTime
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

export interface RefreshTokenRequestDto {
    AccessToken: string;
    RefreshToken: string;
}

export interface ForgotPasswordRequestDto {
    Email: string;
}

export interface ResetPasswordRequestDto {
    Email: string;
    Code: string;
    NewPassword: string;
}

export interface PublicVerifyEmailRequestDto {
    Email: string;
    Code: string;
}
