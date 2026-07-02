import { config as appConfiguration } from '#config';

/**
 * Get a configuration value using dot notation.
 * Example: config('app.port', 3000)
 */
export function config<T = unknown>(key: string, fallback?: T): T {
  const parts = key.split('.');
  let current: unknown = appConfiguration;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return fallback as T;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current !== undefined ? (current as T) : (fallback as T);
}
