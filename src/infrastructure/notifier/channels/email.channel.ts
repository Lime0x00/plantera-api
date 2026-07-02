import type {
  INotificationChannel,
  NotifyPayload,
} from '#infrastructure/notifier/notifier.interface';
import type { MailService } from '#infrastructure/mail/mail.service';
import { Logger } from '#infrastructure/observability/logger';

interface EmailChannelDeps {
  mailService: MailService;
  userRepository: {
    findUnique: (args: {
      where: { id: number };
    }) => Promise<{ email: string } | null>;
  };
}

export class EmailChannel implements INotificationChannel {
  readonly name = 'email';
  #deps: EmailChannelDeps;

  constructor(deps: EmailChannelDeps) {
    this.#deps = deps;
  }

  async send(userId: number, payload: NotifyPayload): Promise<void> {
    try {
      const user = await this.#deps.userRepository.findUnique({
        where: { id: userId },
      });
      if (!user?.email) return;
      await this.#deps.mailService.queueTemplate(
        user.email,
        payload.title,
        'notification',
        {
          title: payload.title,
          body: payload.body,
          type: payload.type,
          plantId: payload.plantId ?? null,
        }
      );
    } catch (err) {
      Logger.error('[EmailChannel] Failed to send email', {
        userId,
        error: (err as Error).message,
      });
    }
  }
}
