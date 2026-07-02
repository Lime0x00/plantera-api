import { Router } from 'express';
import { container } from '#app/container';
import { NotificationController } from '#features/notification/notification.controller';
import { authenticate } from '#framework/middleware/auth.middleware';
import { validateQuery } from '#framework/middleware/validation.middleware';
import { NotificationListQueryDto } from '#features/notification/dtos';

const notificationRouter = Router();
const c = container.resolve<NotificationController>('notificationController');

notificationRouter.use(authenticate);

notificationRouter.get('/', validateQuery(NotificationListQueryDto), c.list);
notificationRouter.patch('/:id/read', c.markAsRead);

export { notificationRouter };
