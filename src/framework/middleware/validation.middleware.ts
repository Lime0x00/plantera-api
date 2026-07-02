import type { NextFunction, Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationError } from '#common/errors';
import { API_MESSAGES } from '#common/types/index';
import { resolveErrorCode } from '#common/validation/constraint-codes';

declare module 'express' {
  interface Request {
    validatedQuery?: Record<string, unknown>;
  }
}

const OPERATION_MAP: Record<string, string> = {
  '/api/v1/auth/register': 'register',
  '/api/v1/auth/login': 'login',
  '/api/v1/auth/forgot-password': 'forgotPassword',
  '/api/v1/auth/verify-otp': 'verifyOtp',
  '/api/v1/auth/reset-password': 'resetPassword',
  '/api/v1/auth/logout': 'logout',
  '/api/v1/my-plants': 'addToMyPlants',
  '/api/v1/my-plants/{id}/schedule': 'updateSchedule',
  '/api/v1/my-plants/care/calendar': 'getCareCalendar',
  '/api/v1/plants': 'listPlants',
  '/api/v1/plants/classify': 'classifyPlant',
  '/api/v1/plants/diagnose': 'diagnosePlant',
  '/api/v1/diseases': 'listDiseases',
  '/api/v1/notifications': 'listNotifications',
  '/api/v1/diagnostics': 'listDiagnostics',
  '/api/v1/diagnostics/{id}': 'getDiagnostic',
  '/api/v1/profile': 'updateProfile',
  '/api/v1/profile/password': 'changePassword',
  '/api/v1/profile/notifications': 'updateNotificationPreferences',
  '/api/v1/profile/push-token': 'savePushToken',
  '/api/v1/posts': 'createCommunityPost',
  '/api/v1/posts/{id}': 'updateCommunityPost',
  '/api/v1/posts/{id}/comments': 'createCommunityPost',
  '/api/v1/posts/comments/{id}': 'createCommunityPost',
  '/api/v1/profile/email/send-otp': 'updateProfile',
  '/api/v1/profile/email/verify': 'updateProfile',
};

export function validateDto(dtoClass: new () => object) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const details: Record<string, { code: string; message: string }> = {};

      for (const err of errors) {
        if (err.constraints) {
          const [constraint, msg] = Object.entries(err.constraints)[0];
          details[err.property] = {
            code: resolveErrorCode(constraint),
            message: msg,
          };
        }
      }

      const path =
        '/' +
        req.originalUrl
          .split('?')[0]
          .replace(/\/\d+/g, '/{id}')
          .replace(/\/{2,}/g, '/')
          .replace(/^\/+|\/+$/g, '');
      const opId = OPERATION_MAP[path] || OPERATION_MAP[req.path] || '';
      const specMsg = opId
        ? (API_MESSAGES as Record<string, Record<string, string>>)[opId]?.[
            '422'
          ]
        : undefined;

      return next(
        new ValidationError(
          specMsg || 'Validation failed for request details.',
          details
        )
      );
    }

    req.body = dtoInstance;
    return next();
  };
}

export function validateQuery(dtoClass: new () => object) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.query);
    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const details: Record<string, { code: string; message: string }> = {};

      for (const err of errors) {
        if (err.constraints) {
          const [constraint, msg] = Object.entries(err.constraints)[0];
          details[err.property] = {
            code: resolveErrorCode(constraint),
            message: msg,
          };
        }
      }

      const path =
        '/' +
        req.originalUrl
          .split('?')[0]
          .replace(/\/\d+/g, '/{id}')
          .replace(/\/{2,}/g, '/')
          .replace(/^\/+|\/+$/g, '');
      const opId = OPERATION_MAP[path] || OPERATION_MAP[req.path] || '';
      const specMsg = opId
        ? (API_MESSAGES as Record<string, Record<string, string>>)[opId]?.[
            '422'
          ]
        : undefined;

      return next(
        new ValidationError(
          specMsg || 'Validation failed for query parameters.',
          details
        )
      );
    }

    req.validatedQuery = dtoInstance as Record<string, unknown>;
    return next();
  };
}
