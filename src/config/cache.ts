import { env } from '#common/env';

type CacheDriver = 'REDIS' | 'MEMORY';

export type CacheConfig = {
  driver: CacheDriver;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
};

export const cacheConfig: CacheConfig = {
  driver: env<CacheDriver>('CACHE_DRIVER', 'REDIS'),
  redis: {
    host: env<string>('REDIS_HOST', 'localhost'),
    port: env<number>('REDIS_PORT', 6379),
    password: env<string>('REDIS_PASSWORD', ''),
  },
};
