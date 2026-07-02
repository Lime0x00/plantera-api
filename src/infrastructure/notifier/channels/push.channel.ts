import type {
  INotificationChannel,
  NotifyPayload,
} from '#infrastructure/notifier/notifier.interface';
import { Logger } from '#infrastructure/observability/logger';

export class PushChannel implements INotificationChannel {
  readonly name = 'push';

  async send(userId: number, payload: NotifyPayload): Promise<void> {
    Logger.info(
      '[PushChannel] Push not yet implemented — would send push to user',
      { userId, type: payload.type }
    );
  }
}
