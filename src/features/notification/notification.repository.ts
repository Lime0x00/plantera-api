import { BaseRepository } from '#infrastructure/database/base-repository';
import {
  INotificationRepository,
  NotificationUpdateInput,
  NotificationWhereUniqueInput,
} from './notification.repository.interface';
import { NotificationModel } from './domain';

export class NotificationRepository
  extends BaseRepository<
    NotificationModel,
    NotificationWhereUniqueInput,
    Record<string, unknown>,
    Record<string, unknown>,
    NotificationUpdateInput
  >
  implements INotificationRepository
{
  public constructor() {
    super(NotificationModel);
  }

  public async count(args?: {
    where?: Record<string, unknown>;
  }): Promise<number> {
    return this.driver.count(args);
  }
}
