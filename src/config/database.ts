import { env } from '#common/env';

type DefaultDatabaseConnection = 'postgresql' | 'sqlite' | 'mongodb';

export type DatabaseConfig = {
  default: DefaultDatabaseConnection;

  connections: {
    postgresql: {
      host: string;
      port: number;
      name: string;
      user: string;
      password: string;
    };
    sqlite?: {
      database: string;
    };
    mongodb?: {
      url: string;
    };
  };

  cache: {
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
  };

  migrations: {
    table: string;
    update_date_on_publish: boolean;
  };

  redis: {
    client: string;
    options: {
      cluster: string;
      prefix: string;
    };
    default: {
      url: string;
      host: string;
      password: string;
      port: number;
      database: number;
    };
  };
};

export const databaseConfig: DatabaseConfig = {
  default: env<DefaultDatabaseConnection>('DB_CONNECTION', 'postgresql'),

  connections: {
    postgresql: {
      host: env<string>('DB_HOST', 'localhost'),
      port: env<number>('DB_PORT', 5432),
      name: env<string>('DB_NAME', 'depiplant'),
      user: env<string>('DB_USER', 'postgres'),
      password: env<string>('DB_PASSWORD', 'postgres'),
    },
  },

  cache: {
    REDIS_HOST: env<string>('REDIS_HOST', 'localhost'),
    REDIS_PORT: env<number>('REDIS_PORT', 6379),
    REDIS_PASSWORD: env<string>('REDIS_PASSWORD', ''),
  },

  migrations: {
    table: 'migrations',
    update_date_on_publish: true,
  },

  redis: {
    client: env<string>('REDIS_CLIENT', 'ioredis'),

    options: {
      cluster: env<string>('REDIS_CLUSTER', 'redis'),
      prefix: env<string>(
        'REDIS_PREFIX',
        `${env<string>('APP_NAME', 'node_app')}_database_`
      ),
    },

    default: {
      url: env<string>('REDIS_URL', ''),
      host: env<string>('REDIS_HOST', '127.0.0.1'),
      password: env<string>('REDIS_PASSWORD', ''),
      port: env<number>('REDIS_PORT', 6379),
      database: env<number>('REDIS_DB', 0),
    },
  },
};
