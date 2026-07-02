import { Resource } from '#common/types/http/resources';

export type NotificationSchema = {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  plantId: number | null;
  scheduledTime: string | null;
  createdAt: string;
};

export class NotificationResource extends Resource<
  unknown,
  NotificationSchema
> {
  protected transform(n: unknown): NotificationSchema {
    const notif = n as Record<string, unknown>;
    return {
      id: notif.id as number,
      type: notif.type as string,
      title: notif.title as string,
      body: notif.body as string,
      isRead: notif.isRead as boolean,
      plantId: (notif.plantId as number | null) ?? null,
      scheduledTime:
        notif.scheduledTime instanceof Date
          ? notif.scheduledTime.toISOString()
          : ((notif.scheduledTime as string | null) ?? null),
      createdAt:
        notif.createdAt instanceof Date
          ? notif.createdAt.toISOString()
          : (notif.createdAt as string),
    };
  }
}
