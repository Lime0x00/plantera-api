import { env } from '#common/env';

export type QueueDriverType = 'BULLMQ' | 'RABBITMQ';

export type QueueConfig = {
  driver: QueueDriverType;
  connections: {
    bullmq: {
      host: string;
      port: number;
      password?: string;
    };
    rabbitmq: {
      host: string;
      port: number;
      username?: string;
      password?: string;
      queue_name: string;
    };
  };
};

export const queueConfig: QueueConfig = {
  driver: env<QueueDriverType>('QUEUE_DRIVER', 'BULLMQ'),

  connections: {
    bullmq: {
      host: env<string>('REDIS_HOST', 'localhost'),
      port: env<number>('REDIS_PORT', 6379),
      password: env<string>('REDIS_PASSWORD', ''),
    },

    rabbitmq: {
      host: env<string>('RABBITMQ_HOST', 'localhost'),
      port: env<number>('RABBITMQ_PORT', 5672),
      username: env<string>('RABBITMQ_USERNAME', 'guest'),
      password: env<string>('RABBITMQ_PASSWORD', 'guest'),
      queue_name: env<string>('RABBITMQ_QUEUE_NAME', 'default_queue'),
    },
  },
};
