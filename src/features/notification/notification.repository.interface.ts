import type { FindUniqueArgs, FindManyArgs, UpdateArgs } from '#common/types';
import type { NotificationModel } from './domain';

export interface NotificationWhereUniqueInput {
  id?: number;
}

export interface NotificationCreateInput {
  userId: number;
  plantId?: number | null;
  type: string;
  title: string;
  body: string;
  scheduledTime?: Date | null;
}

export interface NotificationUpdateInput {
  isRead?: boolean;
}

export interface INotificationRepository {
  findMany(
    args?: FindManyArgs<Record<string, unknown>>
  ): Promise<NotificationModel[]>;
  findUnique(
    args: FindUniqueArgs<NotificationWhereUniqueInput>
  ): Promise<NotificationModel | null>;
  create(args: { data: Record<string, unknown> }): Promise<NotificationModel>;
  update(
    args: UpdateArgs<NotificationWhereUniqueInput, NotificationUpdateInput>
  ): Promise<NotificationModel>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}
