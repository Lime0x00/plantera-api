import type { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import contextStorage from './context-storage';
import type { RequestContext } from './request-context';

export function contextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const acceptLanguage = req.headers['accept-language'] as string | undefined;
  const locale =
    acceptLanguage?.split(',')[0]?.split('-')[0]?.trim() || undefined;

  const context: RequestContext = {
    requestId: (req.headers['x-request-id'] as string) || uuid(),
    traceId: (req.headers['x-trace-id'] as string) || uuid(),
    ip: req.ip || '0.0.0.0',
  };

  if (locale) {
    context.locale = locale;
  }

  const userAgent = req.headers['user-agent'];
  if (userAgent) {
    context.userAgent = String(userAgent);
  }

  if (req.user) {
    context.user = {
      id: String(req.user.userId),
      role: req.user.role,
    };
  }

  contextStorage.run(context, next);
}
