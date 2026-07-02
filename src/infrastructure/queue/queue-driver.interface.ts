export interface IJob<T = unknown> {
  id?: string;
  name: string;
  data: T;
  progress(value: number): Promise<void>;
  log(message: string): Promise<void>;
}

export interface IQueueDriver {
  add(
    queueName: string,
    jobName: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<void>;
  process<T = unknown>(
    queueName: string,
    handler: (job: IJob<T>) => Promise<void>
  ): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
