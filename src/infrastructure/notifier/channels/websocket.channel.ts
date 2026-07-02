import type {
  INotificationChannel,
  NotifyPayload,
} from '#infrastructure/notifier/notifier.interface';
import type { NotificationGateway } from '#infrastructure/websocket/notification.gateway';

export class WebSocketChannel implements INotificationChannel {
  readonly name = 'websocket';
  #gateway: NotificationGateway | null = null;

  setGateway(gateway: NotificationGateway): void {
    this.#gateway = gateway;
  }

  async send(userId: number, payload: NotifyPayload): Promise<void> {
    if (!this.#gateway) return;
    this.#gateway.emitToUser(userId, 'notification', {
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? null,
      plantId: payload.plantId ?? null,
    });
  }
}
