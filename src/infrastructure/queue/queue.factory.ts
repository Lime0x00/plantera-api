import { IQueueDriver } from '#infrastructure/queue/queue-driver.interface';
import { BullMQDriver, RabbitMQDriver } from '#infrastructure/queue/drivers';
import { config } from '#common/helpers';

export class QueueFactory {
  private static activeDriver: IQueueDriver;

  public static queue(): IQueueDriver {
    if (this.activeDriver) {
      return this.activeDriver;
    }

    switch (config('queue.driver')) {
      case 'RABBITMQ':
        this.activeDriver = new RabbitMQDriver();
        break;
      case 'BULLMQ':
      default:
        this.activeDriver = new BullMQDriver();
        break;
    }

    return this.activeDriver;
  }
}
