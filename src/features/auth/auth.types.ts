import type { $Enums } from '#common/types/generated/prisma';

import type { RegisterRequestDto } from './dtos/register.dto';
import type { LoginRequestDto } from './dtos/login.dto';
import type { ForgotPasswordRequestDto } from './dtos/forgot-password.dto';
import type { VerifyOtpRequestDto } from './dtos/verify-otp.dto';
import type { ResetPasswordRequestDto } from './dtos/reset-password.dto';

export type OtpChannel = $Enums.OtpChannel;

export type AuthWhereInput = Record<string, unknown>;

export type RegisterRequest = RegisterRequestDto;
export type LoginRequest = LoginRequestDto;
export type ForgotPasswordRequest = ForgotPasswordRequestDto;
export type VerifyOtpRequest = VerifyOtpRequestDto;
export type ResetPasswordRequest = ResetPasswordRequestDto;
