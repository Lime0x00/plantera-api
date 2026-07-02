import 'reflect-metadata';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';

import { globalErrorHandler } from '#framework/middleware/global-error-handler.js';
import { activityLoggerMiddleware } from '#framework/middleware/activity-logger.middleware';
import { validateContentType } from '#framework/middleware/content-type.middleware';
import { config } from '#common/helpers';
import { NotFoundError } from '#common/errors';

const app: Application = express();

app.use(activityLoggerMiddleware);
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public', 'uploads'))
);
app.use(express.json());
app.use(validateContentType);

if (config('app.enable_security_headers')) {
  app.use(helmet());
}

app.use(
  cors({
    origin: config('app.allowed_origins'),
    methods: config('app.allowed_methods'),
    allowedHeaders: config('app.allowed_headers'),
  })
);

import { apiV1Router } from '#routes';

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/v1', apiV1Router);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Route not found'));
});
app.use(globalErrorHandler);

export default app;
