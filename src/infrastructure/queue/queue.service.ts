import {
  IQueueDriver,
  IJob,
} from '#infrastructure/queue/queue-driver.interface';

interface QueueServiceDeps {
  queueDriver: IQueueDriver;
}

export class QueueService {
  private driver: IQueueDriver;

  constructor({ queueDriver }: QueueServiceDeps) {
    this.driver = queueDriver;
  }

  public getDriver(): IQueueDriver {
    return this.driver;
  }

  /**
   * High-level: Direct dispatch of a job onto a specific queue
   */
  public async dispatch(
    queueName: string,
    jobName: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<void> {
    await this.driver.add(queueName, jobName, data, options);
  }

  /**
   * High-level: Scheduling a repeated job using a Cron expression
   */
  public async schedule(
    queueName: string,
    jobName: string,
    cronExpression: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<void> {
    await this.driver.add(queueName, jobName, data, {
      ...options,
      repeat: {
        pattern: cronExpression,
      },
    });
  }

  /**
   * High-level: Start a worker processing jobs on a specific queue
   */
  public process<T = unknown>(
    queueName: string,
    handler: (job: IJob<T>) => Promise<void>
  ): void {
    this.driver.process(queueName, handler);
  }

  public async connect(): Promise<void> {
    await this.driver.connect();
  }

  public async disconnect(): Promise<void> {
    await this.driver.disconnect();
  }
}
