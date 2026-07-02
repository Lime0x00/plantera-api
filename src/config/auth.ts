import { env } from '#common/env';

export type AuthConfig = {
  jwtSecret: string;
  jwtExpiresIn: number;
  jwtRefreshExpiresIn: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  otpCodeMin: number;
  otpCodeMax: number;
  otpTtlMinutes: number;
  resetTokenTtlMinutes: number;
};

export const authConfig: AuthConfig = {
  jwtSecret: env<string>('JWT_SECRET', 'plantera-jwt-secret-dev'),
  jwtExpiresIn: env<number>('JWT_EXPIRES_IN', 3600),
  jwtRefreshExpiresIn: env<number>('JWT_REFRESH_EXPIRES_IN', 604800),
  maxLoginAttempts: env<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5),
  lockoutMinutes: env<number>('AUTH_LOCKOUT_MINUTES', 15),
  otpCodeMin: env<number>('OTP_CODE_MIN', 100000),
  otpCodeMax: env<number>('OTP_CODE_MAX', 999999),
  otpTtlMinutes: env<number>('OTP_TTL_MINUTES', 5),
  resetTokenTtlMinutes: env<number>('RESET_TOKEN_TTL_MINUTES', 5),
};
