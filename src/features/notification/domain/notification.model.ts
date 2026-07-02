import { BaseModel } from '#framework/domain/base-model';

export class NotificationModel extends BaseModel {
  static modelKey = 'notification';

  userId?: number;
  plantId?: number | null;
  type?: string;
  title?: string;
  body?: string;
  isRead?: boolean;
  scheduledTime?: Date | null;
}
