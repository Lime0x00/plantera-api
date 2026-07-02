import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import { parsePagination, parseIdParam } from '#common/helpers';

import { NotificationService } from '#features/notification/notification.service';
import { NotificationResource } from '#features/notification/resources';

interface NotificationControllerDeps {
  services: { notificationService: NotificationService };
}

export class NotificationController extends Controller {
  #service: NotificationService;
  #resource = new NotificationResource();

  constructor({
    services: { notificationService },
  }: NotificationControllerDeps) {
    super();
    this.#service = notificationService;
  }

  public async list(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { page, limit } = parsePagination(req);
      const result = await this.#service.list(req.user!.userId, page, limit);

      return super.ok(
        res,
        {
          data: this.#resource.collection(result.data),
          meta: result.meta,
        },
        'Notifications retrieved successfully'
      );
    });
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      await this.#service.markAsRead(
        req.user!.userId,
        parseIdParam(req.params.id)
      );

      return super.ok(res, {}, 'Notification marked as read');
    });
  }
}
