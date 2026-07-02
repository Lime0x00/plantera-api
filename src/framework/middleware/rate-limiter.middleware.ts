import rateLimit from 'express-rate-limit';

import type { Request, Response, NextFunction } from 'express';

import { TooManyRequestsError } from '#common/errors';
import { NodeEnv } from '#common/constants';
import { config } from '#common/helpers';

const skip = () =>
  config<NodeEnv>('app.node_env') === NodeEnv.TEST ||
  config<NodeEnv>('app.node_env') === NodeEnv.DEVELOPMENT;

function handler(_req: Request, _res: Response, next: NextFunction) {
  next(new TooManyRequestsError());
}

const opts = {
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
};

export const authLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const apiLimiter = rateLimit({
  ...opts,
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const mlLimiter = rateLimit({ ...opts, windowMs: 60 * 1000, max: 5 });
