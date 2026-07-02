import type { NotificationModel } from '#features/notification/domain/notification.model';

export interface NotifyPayload {
  userId: number;
  type: string;
  title: string;
  body: string;
  plantId?: number | null;
  scheduledTime?: Date | null;
  data?: Record<string, unknown>;
}

export interface INotificationChannel {
  readonly name: string;
  send(userId: number, payload: NotifyPayload): Promise<void>;
}

export interface INotifier {
  send(payload: NotifyPayload): Promise<NotificationModel | null>;
}
