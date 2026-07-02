import { faker } from '@faker-js/faker';

export interface NotificationPreferencesFactoryData {
  userId: number;
  pushEnabled: boolean;
  wateringReminders: boolean;
  fertilizingReminders: boolean;
  emailNotifications: boolean;
}

export function makeNotificationPreferences(
  userId: number,
  data?: Partial<NotificationPreferencesFactoryData>
): NotificationPreferencesFactoryData {
  return {
    userId,
    pushEnabled: data?.pushEnabled ?? faker.datatype.boolean(),
    wateringReminders: data?.wateringReminders ?? faker.datatype.boolean(),
    fertilizingReminders:
      data?.fertilizingReminders ?? faker.datatype.boolean(),
    emailNotifications: data?.emailNotifications ?? faker.datatype.boolean(),
  };
}
