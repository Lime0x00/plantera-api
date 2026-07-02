import type {
  INotifier,
  INotificationChannel,
  NotifyPayload,
} from '#infrastructure/notifier/notifier.interface';
import type { NotificationModel } from '#features/notification/domain/notification.model';
import type { INotificationRepository } from '#features/notification/notification.repository.interface';
import type { INotificationPreferencesRepository } from '#features/user/notificationPreferences.repository.interface';
import { Logger } from '#infrastructure/observability/logger';

export class Notifier implements INotifier {
  #channels: INotificationChannel[];
  #notifRepo: INotificationRepository;
  #prefsRepo: INotificationPreferencesRepository;

  constructor(
    channels: INotificationChannel[],
    deps: {
      notificationRepository: INotificationRepository;
      notificationPreferencesRepository: INotificationPreferencesRepository;
    }
  ) {
    this.#channels = channels;
    this.#notifRepo = deps.notificationRepository;
    this.#prefsRepo = deps.notificationPreferencesRepository;
  }

  async send(payload: NotifyPayload): Promise<NotificationModel | null> {
    const prefs = await this.#prefsRepo.findUnique({
      where: { userId: payload.userId },
    });
    const pushEnabled = prefs?.pushEnabled !== false;
    const emailEnabled = prefs?.emailNotifications !== false;
    const wateringOk =
      payload.type === 'watering_reminder'
        ? prefs?.wateringReminders !== false
        : true;
    const fertilizingOk =
      payload.type === 'fertilizing_reminder'
        ? prefs?.fertilizingReminders !== false
        : true;
    if ((!pushEnabled && !emailEnabled) || !wateringOk || !fertilizingOk)
      return null;

    const notification = await this.#notifRepo.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        plantId: payload.plantId ?? null,
        scheduledTime: payload.scheduledTime ?? null,
      } as unknown as Record<string, unknown>,
    });

    for (const channel of this.#channels) {
      const channelName = channel.name;
      const enabled =
        channelName === 'websocket' || channelName === 'push'
          ? pushEnabled
          : channelName === 'email'
            ? emailEnabled
            : true;

      if (!enabled) continue;

      if (
        channelName === 'email' &&
        (payload.type === 'comment' || payload.type === 'like')
      )
        continue;

      try {
        await channel.send(payload.userId, payload);
      } catch (err) {
        Logger.error(`[Notifier] Channel ${channelName} failed`, {
          error: (err as Error).message,
          userId: payload.userId,
        });
      }
    }

    return notification;
  }
}
