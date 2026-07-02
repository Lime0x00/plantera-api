import ejs from 'ejs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMailDriver } from '#infrastructure/mail/mail-driver.interface';
import { MailDriverFactory } from '#infrastructure/mail/driver.factory';
import { QueueService } from '#infrastructure/queue/queue.service';
import { config } from '#common/helpers';
import { ContextService } from '#framework/context/context.service';
import type { Locale } from './i18n';
import { t } from './i18n';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, 'templates');

interface MailServiceDeps {
  queueService: QueueService;
}

export class MailService {
  private driver: IMailDriver;
  private queueService: QueueService;

  constructor({ queueService }: MailServiceDeps) {
    this.driver = MailDriverFactory.getDriver();
    this.queueService = queueService;
  }

  async sendMail(
    to: string | string[],
    subject: string,
    body: string,
    html?: string
  ): Promise<void> {
    await this.driver.send({ to, subject, text: body, html });
  }

  async sendTemplate<T extends Record<string, unknown>>(
    to: string | string[],
    subject: string,
    template: string,
    data: T,
    locale: Locale = ContextService.locale() as Locale
  ): Promise<void> {
    const frontendUrl = config<string>(
      'app.frontend_url',
      'http://localhost:3000'
    );
    const html = await ejs.renderFile(
      path.join(TEMPLATES_DIR, `${template}.ejs`),
      { ...data, frontendUrl, t: t.bind(null, locale), locale },
      { rmWhitespace: true }
    );
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    await this.sendMail(to, subject, text, html);
  }

  async queueMail(
    to: string | string[],
    subject: string,
    body: string,
    html?: string
  ): Promise<void> {
    await this.queueService.dispatch('notifications', 'send-email', {
      to,
      subject,
      body,
      html,
    });
  }

  async queueTemplate<T extends Record<string, unknown>>(
    to: string | string[],
    subject: string,
    template: string,
    data: T,
    locale: Locale = ContextService.locale() as Locale
  ): Promise<void> {
    const frontendUrl = config<string>(
      'app.frontend_url',
      'http://localhost:3000'
    );
    const html = await ejs.renderFile(
      path.join(TEMPLATES_DIR, `${template}.ejs`),
      { ...data, frontendUrl, t: t.bind(null, locale), locale },
      { rmWhitespace: true }
    );
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    await this.queueMail(to, subject, text, html);
  }
}
