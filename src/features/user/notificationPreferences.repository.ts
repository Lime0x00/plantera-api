import { BaseRepository } from '#infrastructure/database/base-repository';
import type { UserWhereInput } from '#features/user/user.types';
import { NotificationPreferences } from '#features/user/domain/notificationPreferences.model';
import type {
  INotificationPreferencesRepository,
  NotificationPreferencesCreateInput,
  NotificationPreferencesUpdateInput,
  NotificationPreferencesWhereUniqueInput,
} from './notificationPreferences.repository.interface';

export class NotificationPreferencesRepository
  extends BaseRepository<
    NotificationPreferences,
    NotificationPreferencesWhereUniqueInput,
    UserWhereInput,
    NotificationPreferencesCreateInput,
    NotificationPreferencesUpdateInput
  >
  implements INotificationPreferencesRepository
{
  public constructor() {
    super(NotificationPreferences);
  }
}
