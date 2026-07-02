import { Router } from 'express';

import { container } from '#app/container';

import { authenticate } from '#framework/middleware/auth.middleware';
import { validateDto } from '#framework/middleware/validation.middleware';
import { AuthController } from '#features/auth/auth.controller';
import { authLimiter } from '#framework/middleware/rate-limiter.middleware';

import {
  RegisterRequestDto,
  LoginRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyOtpRequestDto,
  RefreshTokenRequestDto,
} from '#features/auth/dtos';

const authRouter = Router();
const c = container.resolve<AuthController>('authController');

authRouter.post(
  '/register',
  authLimiter,
  validateDto(RegisterRequestDto),
  c.register
);
authRouter.post('/login', authLimiter, validateDto(LoginRequestDto), c.login);
authRouter.post('/refresh', validateDto(RefreshTokenRequestDto), c.refresh);
authRouter.post(
  '/forgot-password',
  authLimiter,
  validateDto(ForgotPasswordRequestDto),
  c.forgotPassword
);
authRouter.post(
  '/verify-otp',
  authLimiter,
  validateDto(VerifyOtpRequestDto),
  c.verifyOtp
);
authRouter.post(
  '/reset-password',
  authLimiter,
  validateDto(ResetPasswordRequestDto),
  c.resetPassword
);
authRouter.post(
  '/logout',
  authenticate,
  validateDto(RefreshTokenRequestDto),
  c.logout
);

export { authRouter };
