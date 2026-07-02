export const AuthErrors = {
  INVALID_CREDENTIALS: 'Invalid credentials.',
  EMAIL_CONFLICT: 'Email address is already in use by another account.',
  USERNAME_CONFLICT: 'Username is already taken.',
  REGISTRATION_CONFLICT: 'Registration conflict error.',
  ACCOUNT_LOCKED: 'Account locked due to multiple failed login attempts.',
  OTP_INVALID: 'Invalid or expired OTP code.',
  RESET_TOKEN_INVALID: 'Invalid or expired reset token.',
  USER_NOT_FOUND: 'User not found.',
} as const;
