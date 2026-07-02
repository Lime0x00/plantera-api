import type { IMailDriver, SendMailOptions } from './../mail-driver.interface';
import { Logger } from '#infrastructure/observability/logger';

export class LogMailDriver implements IMailDriver {
  async send(options: SendMailOptions): Promise<void> {
    Logger.info(`[LogMailDriver] Email would be sent to: ${options.to}`);
    Logger.info(`[LogMailDriver] Subject: ${options.subject}`);
    if (options.text) {
      Logger.info(`[LogMailDriver] Body: ${options.text.substring(0, 100)}...`);
    }
  }

  async connect(): Promise<void> {
    Logger.info('[LogMailDriver] Connected (log mode)');
  }

  async disconnect(): Promise<void> {
    Logger.info('[LogMailDriver] Disconnected');
  }
}
