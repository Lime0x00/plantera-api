import { BaseModel } from '#framework/domain/base-model';

export class NotificationPreferences extends BaseModel {
  static modelKey = 'notificationPreferences';

  userId?: number;
  pushEnabled?: boolean;
  wateringReminders?: boolean;
  fertilizingReminders?: boolean;
  emailNotifications?: boolean;
}
