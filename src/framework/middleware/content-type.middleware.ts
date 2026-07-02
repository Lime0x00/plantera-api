import type { Request, Response, NextFunction } from 'express';
import { UnsupportedMediaTypeError } from '#common/errors';

const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'multipart/form-data',
  'application/x-www-form-urlencoded',
];

export function validateContentType(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const contentType = req.headers['content-type']?.toLowerCase() ?? '';

  if (!contentType) {
    return next();
  }

  const isAllowed = ALLOWED_CONTENT_TYPES.some((t) =>
    contentType.startsWith(t)
  );
  if (!isAllowed) {
    return next(new UnsupportedMediaTypeError());
  }

  next();
}
