import { NotFoundError } from '#common/errors';
import { NotificationErrors } from './notification.errors';
import { INotificationRepository } from './notification.repository.interface';
import type {
  INotifier,
  NotifyPayload,
} from '#infrastructure/notifier/notifier.interface';
import { paginate, clampLimit, offset } from '#common/helpers';

interface NotificationServiceDeps {
  notificationRepository: INotificationRepository;
  notifier: INotifier;
}

export class NotificationService {
  #repository: INotificationRepository;
  #notifier: INotifier;

  constructor({ notificationRepository, notifier }: NotificationServiceDeps) {
    this.#repository = notificationRepository;
    this.#notifier = notifier;
  }

  async create(dto: NotifyPayload) {
    return this.#notifier.send(dto);
  }

  async list(userId: number, page: number, limit: number) {
    const take = clampLimit(limit);

    const [data, totalCount] = await Promise.all([
      this.#repository.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset(page, take),
        take,
      }),
      this.#repository.count({ where: { userId } }),
    ]);

    return { data, meta: paginate(totalCount, page, take) };
  }

  async markAsRead(userId: number, notificationId: number) {
    const existing = await this.#repository.findUnique({
      where: { id: notificationId },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(NotificationErrors.NOT_FOUND);
    }

    return this.#repository.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
