import { Logger } from '#infrastructure/observability/logger';
import type {
  IChannelDriver,
  ChannelPayload,
} from '#infrastructure/channel/channel.interface';
import type { MailService } from '#infrastructure/mail/mail.service';

interface EmailChannelDeps {
  mailService: MailService;
}

export class EmailChannel implements IChannelDriver {
  #mailService: MailService;

  constructor({ mailService }: EmailChannelDeps) {
    this.#mailService = mailService;
  }

  async send(to: string, payload: ChannelPayload): Promise<void> {
    try {
      if (payload.template) {
        await this.#mailService.queueTemplate(
          to,
          payload.subject ?? '',
          payload.template,
          payload.templateData ?? {}
        );
      } else if (payload.body) {
        await this.#mailService.queueMail(
          to,
          payload.subject ?? '',
          payload.body
        );
      }
    } catch (err) {
      Logger.error(
        `[EmailChannel] Failed to send email to ${to}: ${err instanceof Error ? err.message : err}`
      );
    }
  }
}
