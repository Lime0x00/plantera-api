import type { AppConfig } from './app';
import { appConfig } from './app';

import type { DatabaseConfig } from './database';
import { databaseConfig } from './database';

import type { QueueConfig } from './queue';
import { queueConfig } from './queue';

import type { MailConfig } from './mail';
import { mailConfig } from './mail';

import type { CacheConfig } from './cache';
import { cacheConfig } from './cache';

import type { FilesystemConfig } from './filesystem';
import { filesystemConfig } from './filesystem';

import type { AuthConfig } from './auth';
import { authConfig } from './auth';

export interface AppConfiguration {
  app: AppConfig;
  database: DatabaseConfig;
  queue: QueueConfig;
  mail: MailConfig;
  cache: CacheConfig;
  filesystem: FilesystemConfig;
  auth: AuthConfig;
}

export const config: AppConfiguration = {
  app: appConfig,
  database: databaseConfig,
  queue: queueConfig,
  mail: mailConfig,
  cache: cacheConfig,
  filesystem: filesystemConfig,
  auth: authConfig,
};

export default config;
