import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { config } from '#common/helpers';
import {
  IJob,
  IQueueDriver,
} from '#infrastructure/queue/queue-driver.interface';
import { Logger } from '#infrastructure/observability/logger';

const DEAD_LETTER_SUFFIX = '-dlq';

export class BullMQDriver implements IQueueDriver {
  private queues = new Map<string, Queue>();
  private deadLetterQueues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private redisConnection: Redis | null = null;

  public async connect(): Promise<void> {
    if (!this.redisConnection) {
      this.redisConnection = new Redis({
        host: config('queue.connections.bullmq.host', 'localhost'),
        port: Number(config('queue.connections.bullmq.port', 6379)),
        password: config('queue.connections.bullmq.password') || undefined,
        maxRetriesPerRequest: null, // Mandatory for BullMQ
      });
    }
  }

  public async disconnect(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    );
    this.queues.clear();

    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker.close())
    );
    this.workers.clear();

    if (this.redisConnection) {
      await this.redisConnection.quit();
      this.redisConnection = null;
    }
  }

  public async add(
    queueName: string,
    jobName: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<void> {
    await this.connect();
    const queue = this.getQueue(queueName);
    await queue.add(jobName, data, options);
  }

  public process<T = unknown>(
    queueName: string,
    handler: (job: IJob<T>) => Promise<void>
  ): void {
    if (this.workers.has(queueName)) {
      throw new Error(`Worker already registered for queue [${queueName}]`);
    }

    const connection = new Redis({
      host: config('queue.connections.bullmq.host', 'localhost'),
      port: Number(config('queue.connections.bullmq.port', 6379)),
      password: config('queue.connections.bullmq.password') || undefined,
      maxRetriesPerRequest: null,
    });

    const worker = new Worker(
      queueName,
      async (job) => {
        await handler({
          ...(job.id ? { id: job.id } : {}),
          name: job.name || 'default',
          data: job.data as T,
          progress: async (value: number) => {
            await job.updateProgress(value);
          },
          log: async (message: string) => {
            await job.log(message);
          },
        });
      },
      { connection: connection as ConnectionOptions }
    );

    worker.on('failed', async (job, err) => {
      Logger.error(
        `Job [${job?.id}] on queue [${queueName}] failed: ${err.message}`
      );
      if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
        const dlq = this.getDeadLetterQueue(queueName);
        await dlq.add(job.name || 'default', job.data, {
          attempts: 1,
          removeOnFail: { count: 100 },
        });
        Logger.warn(
          `Job [${job.id}] moved to dead-letter queue [${queueName}${DEAD_LETTER_SUFFIX}]`
        );
      }
    });

    this.workers.set(queueName, worker);
  }

  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.redisConnection as ConnectionOptions,
      });
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  private getDeadLetterQueue(queueName: string): Queue {
    const dlqName = `${queueName}${DEAD_LETTER_SUFFIX}`;
    if (!this.deadLetterQueues.has(dlqName)) {
      const queue = new Queue(dlqName, {
        connection: this.redisConnection as ConnectionOptions,
        defaultJobOptions: { attempts: 1 },
      });
      this.deadLetterQueues.set(dlqName, queue);
    }
    return this.deadLetterQueues.get(dlqName)!;
  }
}
