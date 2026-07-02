import dotenv from 'dotenv';

import { NodeEnv } from '#common/constants';

const NODE_ENV = process.env.NODE_ENV || NodeEnv.DEVELOPMENT;

let path: string;
switch (NODE_ENV) {
  case NodeEnv.DEVELOPMENT:
    path = '.env.dev';
    break;
  case NodeEnv.PRODUCTION:
    path = '.env.prod';
    break;
  case NodeEnv.STAGING:
    path = '.env.staging';
    break;
  case NodeEnv.TEST:
    path = '.env.test';
    break;
  default:
    throw new Error(`Unknown NODE_ENV: ${NODE_ENV}`);
}

dotenv.config({ path, quiet: true });

/**
 * Get an environment variable with an optional fallback.
 * Automatically logs a warning if a default value is used in production.
 */
export function env<T = unknown>(key: string, fallback?: T): T {
  const value = process.env[key];

  if (value === undefined) {
    if (NODE_ENV === NodeEnv.PRODUCTION && fallback !== undefined) {
      console.warn(
        `[WARNING]: Environment variable [${key}] is missing. Falling back to default.`
      );
    }
    return fallback as T;
  }

  switch (value.toLowerCase()) {
    case 'true':
    case '(true)':
      return true as unknown as T;
    case 'false':
    case '(false)':
      return false as unknown as T;
    case 'empty':
    case '(empty)':
      return '' as unknown as T;
    case 'null':
    case '(null)':
      return null as unknown as T;
  }

  if (/^\d+$/.test(value)) {
    return Number(value) as unknown as T;
  }

  return value as unknown as T;
}
