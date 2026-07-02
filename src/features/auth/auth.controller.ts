import type { Request, NextFunction, Response } from 'express';

import { Controller } from '#framework/presentation/controller';
import type { TypedRequestBody } from '#common/types';

import { AuthService } from '#features/auth/auth.service';
import { UserResource } from '#features/auth/resources';
import { RefreshTokenRequestDto } from '#features/auth/dtos';
import type {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
} from '#features/auth/auth.types';

interface AuthControllerDeps {
  services: { authService: AuthService };
}

export class AuthController extends Controller {
  #authService: AuthService;
  #userResource = new UserResource();

  constructor({ services: { authService } }: AuthControllerDeps) {
    super();
    this.#authService = authService;
  }

  public async register(
    req: TypedRequestBody<RegisterRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const { firstName, lastName, userName, email, password } = req.body;

      const { user, tokens } = await this.#authService.register({
        firstName,
        lastName,
        userName,
        email,
        password,
      });

      return super.created(
        res,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: this.#userResource.make(user),
        },
        'Registration successful'
      );
    });
  }

  public async login(
    req: TypedRequestBody<LoginRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const { user, tokens } = await this.#authService.login(req.body);

      return super.ok(
        res,
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: this.#userResource.make(user),
        },
        'Login successful'
      );
    });
  }

  public async refresh(
    req: TypedRequestBody<RefreshTokenRequestDto>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const tokens = await this.#authService.refresh(req.body.refreshToken);

      return super.ok(res, tokens, 'Token refreshed successfully');
    });
  }

  public async forgotPassword(
    req: TypedRequestBody<ForgotPasswordRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#authService.forgotPassword(req.body);

      return super.ok(res, {}, 'OTP sent to your email');
    });
  }

  public async verifyOtp(
    req: TypedRequestBody<VerifyOtpRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const result = await this.#authService.verifyOtp(req.body);

      return super.ok(res, result, 'OTP verified successfully');
    });
  }

  public async resetPassword(
    req: TypedRequestBody<ResetPasswordRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#authService.resetPassword(req.body);

      return super.ok(res, {}, 'Password reset successfully');
    });
  }

  public async logout(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      await this.#authService.logout(
        req.user!.userId,
        req.accessToken,
        req.body?.refreshToken
      );
      return super.ok(res, {}, 'Logged out successfully');
    });
  }
}
