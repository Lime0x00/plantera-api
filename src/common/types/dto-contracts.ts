import type { RegisterRequestDto } from '#features/auth/dtos/register.dto';
import type { LoginRequestDto } from '#features/auth/dtos/login.dto';
import type { ForgotPasswordRequestDto } from '#features/auth/dtos/forgot-password.dto';
import type { VerifyOtpRequestDto } from '#features/auth/dtos/verify-otp.dto';
import type { ResetPasswordRequestDto } from '#features/auth/dtos/reset-password.dto';
import type { UpdateProfileRequestDto } from '#features/user/dtos/update-profile.dto';
import type { ChangePasswordRequestDto } from '#features/user/dtos/change-password.dto';

export type DtoChecks = {
  register: RegisterRequestDto;
  login: LoginRequestDto;
  forgotPassword: ForgotPasswordRequestDto;
  verifyOtp: VerifyOtpRequestDto;
  resetPassword: ResetPasswordRequestDto;
  updateProfile: UpdateProfileRequestDto;
  changePassword: ChangePasswordRequestDto;
};
