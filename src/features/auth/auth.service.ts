import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { TOKEN_BLACKLIST_PREFIX } from '#common/constants/auth';

import { config } from '#common/helpers';
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '#common/errors';
import { Logger } from '#infrastructure/observability/logger';

import { UserService } from '#features/user/user.service';
import { OtpService } from '#features/auth/otp.service';
import { CacheService } from '#infrastructure/cache/cache.service';
import { IRefreshTokenRepository } from '#features/auth/refreshToken.repository.interface';
import { IAuthObserver } from './observers/auth.observer.interface';

import type {
  RegisterRequestDto,
  LoginRequestDto,
  ForgotPasswordRequestDto,
  VerifyOtpRequestDto,
  ResetPasswordRequestDto,
} from '#features/auth/dtos';
import type { User } from '#features/user/domain/user.model';

import { AuthErrors } from './auth.errors';
import { AuthPolicy } from './auth.policy';

interface AuthServiceDeps {
  userService: UserService;
  otpService: OtpService;
  cacheService: CacheService;
  refreshTokenRepository: IRefreshTokenRepository;
  authPolicy: AuthPolicy;
}

type TokenPair = {
  accessToken: { token: string; type: 'Bearer'; expiresIn: number };
  refreshToken: string;
};

export class AuthService {
  #userService: UserService;
  #otp: OtpService;
  #cache: CacheService;
  #refreshTokenRepo: IRefreshTokenRepository;
  #policy: AuthPolicy;
  #observers: IAuthObserver[] = [];

  constructor({
    userService,
    otpService,
    cacheService,
    refreshTokenRepository,
    authPolicy,
  }: AuthServiceDeps) {
    this.#userService = userService;
    this.#otp = otpService;
    this.#cache = cacheService;
    this.#refreshTokenRepo = refreshTokenRepository;
    this.#policy = authPolicy;
  }

  public registerObserver(observer: IAuthObserver) {
    this.#observers.push(observer);
  }

  private async notify(event: 'onLoginSuccess', user: User): Promise<void>;
  private async notify(event: 'updated', entity: User): Promise<void>;
  private async notify(
    event: keyof IAuthObserver,
    userOrEntity: User
  ): Promise<void> {
    await Promise.all(
      this.#observers.map(async (obs) => {
        const handler = obs[event];
        if (handler) {
          await handler(userOrEntity);
        }
      })
    );
  }

  async #generateTokens(
    userId: number,
    email: string,
    role: string
  ): Promise<TokenPair> {
    const secret = config<string>('auth.jwtSecret');
    const expiresIn = config('auth.jwtExpiresIn', 3600);
    const refreshExpiresIn = config('auth.jwtRefreshExpiresIn', 604800);
    const jti = uuid();

    const accessToken = jwt.sign({ userId, email, role, jti }, secret, {
      expiresIn,
    });
    const rawRefreshToken = uuid().replace(/-/g, '') + uuid().replace(/-/g, '');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const refreshExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);
    await this.#refreshTokenRepo.create({
      data: { userId, tokenHash, expiresAt: refreshExpiresAt },
    });

    return {
      accessToken: { token: accessToken, type: 'Bearer' as const, expiresIn },
      refreshToken: rawRefreshToken,
    };
  }

  async register(
    dto: RegisterRequestDto
  ): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.#userService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      userName: dto.userName,
      password: dto.password,
    });

    const tokens = await this.#generateTokens(
      user.id!,
      user.email,
      user.role ?? 'user'
    );

    return {
      user: {
        id: user.id!,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      } as User,
      tokens: tokens,
    };
  }

  async login(
    dto: LoginRequestDto
  ): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.#userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedError(AuthErrors.INVALID_CREDENTIALS);
    }

    const lockCheck = this.#policy.canLogin(user);

    if (!lockCheck.allowed) {
      const { retryAfterMinutes } = lockCheck;
      throw new ConflictError(
        'Account is locked due to too many failed attempts.',
        {
          attempts: {
            code: 'ACCOUNT_LOCKED',
            message: lockCheck.reason ?? 'Account temporarily locked.',
            retryAfterMinutes: retryAfterMinutes as number,
          },
        }
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const updatedUser = await this.#userService.updateFailedLoginAttempts(
        user.id!,
        newAttempts
      );
      if (updatedUser.lockedUntil) {
        this.notify('updated', updatedUser).catch((err) => {
          Logger.error('[AuthService] Observer notification failed', {
            error: (err as Error).message,
          });
        });
      }
      throw new UnauthorizedError(AuthErrors.INVALID_CREDENTIALS);
    }

    if ((user.failedLoginAttempts ?? 0) > 0 || user.lockedUntil) {
      await this.#userService.resetLoginAttempts(user.id!);
    }

    this.notify('onLoginSuccess', user).catch((err) => {
      Logger.error('[AuthService] Observer notification failed', {
        error: (err as Error).message,
      });
    });

    const tokens = await this.#generateTokens(
      user.id!,
      user.email,
      user.role ?? 'user'
    );

    return {
      user: {
        id: user.id!,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      } as User,
      tokens: tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const stored = await this.#refreshTokenRepo.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    await this.#refreshTokenRepo.update({
      where: { id: stored.id! },
      data: { revokedAt: new Date() },
    });

    const user = await this.#userService.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedError('User not found.');
    }

    return this.#generateTokens(user.id!, user.email, user.role ?? 'user');
  }

  #calculateTokenTtl(expirationTimestamp: number): number {
    return Math.max(1, expirationTimestamp - Math.floor(Date.now() / 1000));
  }

  async logout(
    userId: number,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as {
          jti?: string;
          exp?: number;
        } | null;
        if (decoded?.jti && decoded?.exp) {
          const ttl = this.#calculateTokenTtl(decoded.exp);
          await this.#cache.set(
            `${TOKEN_BLACKLIST_PREFIX}${decoded.jti}`,
            'revoked',
            ttl
          );
        }
      } catch (err) {
        Logger.warn('Access token decoding failed during logout', {
          error: (err as Error).message,
        });
      }
    }

    if (refreshToken) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const stored = await this.#refreshTokenRepo.findUnique({
        where: { tokenHash },
      });

      if (stored && !stored.revokedAt) {
        await this.#refreshTokenRepo.update({
          where: { id: stored.id! },
          data: { revokedAt: new Date() },
        });
      }
    }

    await this.#userService.removePushToken(userId);
  }

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<void> {
    const user = await this.#userService.findByEmail(dto.email);
    if (!user) {
      return;
    }

    await this.#otp.generate(dto.email);
  }

  async verifyOtp(dto: VerifyOtpRequestDto): Promise<{ resetToken: string }> {
    const valid = await this.#otp.verify(dto.email, dto.otp);
    if (!valid) {
      throw new BadRequestError(AuthErrors.OTP_INVALID);
    }

    const resetToken = uuid().replace(/-/g, '');
    await this.#otp.storeResetToken(dto.email, resetToken);

    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const valid = await this.#otp.verifyResetToken(dto.email, dto.resetToken);
    if (!valid) {
      throw new BadRequestError(AuthErrors.RESET_TOKEN_INVALID);
    }

    const user = await this.#userService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundError(AuthErrors.USER_NOT_FOUND);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.#userService.updatePassword(user.id!, hashedPassword);
  }
}
