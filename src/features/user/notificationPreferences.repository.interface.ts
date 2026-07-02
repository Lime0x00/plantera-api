import type { FindUniqueArgs, UpdateArgs } from '#common/types/database';
import { NotificationPreferences } from './domain/notificationPreferences.model';

export interface NotificationPreferencesWhereUniqueInput {
  id?: number;
  userId?: number;
}

export interface NotificationPreferencesCreateInput {
  userId: number;
  pushEnabled?: boolean;
  wateringReminders?: boolean;
  fertilizingReminders?: boolean;
  emailNotifications?: boolean;
}

export interface NotificationPreferencesUpdateInput {
  pushEnabled?: boolean;
  wateringReminders?: boolean;
  fertilizingReminders?: boolean;
  emailNotifications?: boolean;
}

export interface INotificationPreferencesRepository {
  findUnique(
    args: FindUniqueArgs<NotificationPreferencesWhereUniqueInput>
  ): Promise<NotificationPreferences | null>;

  create(args: {
    data: NotificationPreferencesCreateInput;
  }): Promise<NotificationPreferences>;

  update(
    args: UpdateArgs<
      NotificationPreferencesWhereUniqueInput,
      NotificationPreferencesUpdateInput
    >
  ): Promise<NotificationPreferences>;
}
