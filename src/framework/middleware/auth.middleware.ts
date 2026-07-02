import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '#common/errors';
import { config } from '#common/helpers';
import { container } from '#app/container';
import { CacheService } from '#infrastructure/cache/cache.service';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  jti?: string;
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
    accessToken?: string;
  }
}

import { TOKEN_BLACKLIST_PREFIX } from '#common/constants/auth';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new UnauthorizedError(
        'Authentication credentials are missing or invalid.'
      )
    );
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = config('auth.jwtSecret', 'plantera-jwt-secret-dev');
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (decoded.jti) {
      const cacheService = container.resolve<CacheService>('cacheService');
      const blacklisted = await cacheService.has(
        `${TOKEN_BLACKLIST_PREFIX}${decoded.jti}`
      );
      if (blacklisted) {
        return next(
          new UnauthorizedError('Token has been revoked. Please log in again.')
        );
      }
    }

    req.user = decoded;
    req.accessToken = token;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new UnauthorizedError('Your session has expired. Please log in again.')
      );
    }
    return next(
      new UnauthorizedError('Your session has expired. Please log in again.')
    );
  }
}

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.user?.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  return next();
}
