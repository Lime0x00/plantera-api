import amqp, { type ChannelModel, type Channel } from 'amqplib';
import { config } from '#common/helpers';
import {
  IQueueDriver,
  IJob,
} from '#infrastructure/queue/queue-driver.interface';
import { Logger } from '#infrastructure/observability/logger';

const DEAD_LETTER_EXCHANGE_SUFFIX = '-dlx';

export class RabbitMQDriver implements IQueueDriver {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  public async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    const host = config<string>('queue.connections.rabbitmq.host', 'localhost');
    const port = Number(config('queue.connections.rabbitmq.port', 5672));
    const username = config<string>(
      'queue.connections.rabbitmq.username',
      'guest'
    );
    const password = config<string>(
      'queue.connections.rabbitmq.password',
      'guest'
    );

    const url = `amqp://${username}:${password}@${host}:${port}`;
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      Logger.info(`Successfully connected to RabbitMQ at ${host}:${port}`);
    } catch (err: unknown) {
      Logger.error(
        `Failed to connect to RabbitMQ: ${err instanceof Error ? err.message : String(err)}`
      );
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    Logger.info('Disconnected from RabbitMQ');
  }

  public async add(
    queueName: string,
    jobName: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<void> {
    await this.connect();
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const dlxName = `${queueName}${DEAD_LETTER_EXCHANGE_SUFFIX}`;
    await this.channel.assertExchange(dlxName, 'fanout', { durable: true });
    const dlqName = `${queueName}-dlq`;
    await this.channel.assertQueue(dlqName, { durable: true });
    await this.channel.bindQueue(dlqName, dlxName, '');

    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: dlxName,
    });

    const payload = JSON.stringify({
      name: jobName,
      data,
    });

    this.channel.sendToQueue(queueName, Buffer.from(payload), {
      persistent: true,
      ...options,
    });
  }

  public process<T = unknown>(
    queueName: string,
    handler: (job: IJob<T>) => Promise<void>
  ): void {
    this.connect()
      .then(async () => {
        if (!this.channel) {
          throw new Error('RabbitMQ channel not initialized');
        }

        const dlxName = `${queueName}${DEAD_LETTER_EXCHANGE_SUFFIX}`;
        await this.channel.assertExchange(dlxName, 'fanout', { durable: true });
        const dlqName = `${queueName}-dlq`;
        await this.channel.assertQueue(dlqName, { durable: true });
        await this.channel.bindQueue(dlqName, dlxName, '');
        await this.channel.assertQueue(queueName, {
          durable: true,
          deadLetterExchange: dlxName,
        });

        // Fair dispatch: don't dispatch a new message to a worker until it has processed and acked the previous one
        await this.channel.prefetch(1);

        Logger.info(`RabbitMQ consumer registered for queue [${queueName}]`);

        this.channel.consume(
          queueName,
          async (msg) => {
            if (!msg) {
              return;
            }

            try {
              const body = JSON.parse(msg.content.toString());

              const job: IJob<T> = {
                id: msg.fields.deliveryTag.toString(),
                name: body.name || 'default',
                data: body.data,
                progress: async (value: number) => {
                  Logger.debug(
                    `Job [${msg.fields.deliveryTag}] progress: ${value}%`
                  );
                },
                log: async (message: string) => {
                  Logger.debug(
                    `Job [${msg.fields.deliveryTag}] log: ${message}`
                  );
                },
              };

              await handler(job);

              this.channel?.ack(msg);
            } catch (err: unknown) {
              Logger.error(
                `Failed processing RabbitMQ message [${msg.fields.deliveryTag}] on queue [${queueName}]: ${err instanceof Error ? err.message : String(err)}`
              );
              this.channel?.nack(msg, false, false);
            }
          },
          { noAck: false }
        );
      })
      .catch((err) => {
        Logger.error(
          `Failed to register RabbitMQ process handler for queue [${queueName}]: ${err.message}`
        );
      });
  }
}
