import type { AwilixContainer } from 'awilix';
import { Logger } from '#infrastructure/observability/logger';
import { MailService } from '#infrastructure/mail/mail.service';
import type { QueueService } from '#infrastructure/queue/queue.service';
import type { IJob } from '#infrastructure/queue/queue-driver.interface';

export interface NotificationJobData {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export function registerNotificationWorker(
  queueService: QueueService,
  container: AwilixContainer
) {
  queueService.process(
    'notifications',
    async (job: IJob<NotificationJobData>) => {
      Logger.info(`[NotificationWorker] Processing job: ${job.name}`);

      const data = job.data as NotificationJobData;
      const mailService = container.resolve('mailService') as MailService;

      await mailService.sendMail(data.to, data.subject, data.body, data.html);

      Logger.info(
        `[NotificationWorker] Notification sent successfully to ${data.to}`
      );
    }
  );
}
