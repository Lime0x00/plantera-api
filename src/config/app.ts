import { env } from '#common/env';

export type AppConfig = {
  port: number;
  node_env: string;
  name: string;
  driver_type: string;
  allowed_origins: string[];
  allowed_methods: string[];
  allowed_headers: string[];
  enable_security_headers: boolean;
  log_format: string;
  analyzer_url: string;
  frontend_url: string;
  locale: string;
};

export const appConfig: AppConfig = {
  port: env<number>('PORT', 3000),
  node_env: env<string>('NODE_ENV', 'development'),
  name: env<string>('APP_NAME', 'My Core API'),
  driver_type: env<string>('DATABASE_DRIVER', 'PRISMA'),

  allowed_origins: env<string>('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(','),
  allowed_methods: env<string>(
    'ALLOWED_METHODS',
    'GET,POST,PUT,PATCH,DELETE'
  ).split(','),
  allowed_headers: env<string>('ALLOWED_HEADERS', 'Content-Type,Authorization').split(','),

  enable_security_headers: env<boolean>('ENABLE_SECURITY_HEADERS', false),
  log_format: env<string>('LOG_FORMAT', 'text'),
  analyzer_url: env<string>('ANALYZER_URL', 'http://127.0.0.1:5000/v1'),
  frontend_url: env<string>('FRONTEND_URL', 'http://localhost:3000'),
  locale: env<string>('APP_LOCALE', 'en'),
};
