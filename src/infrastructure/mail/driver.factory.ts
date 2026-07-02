import type { IMailDriver } from './mail-driver.interface';
import { NodemailerDriver } from './drivers/nodemailer-driver';
import { LogMailDriver } from './drivers/log-driver';
import { config } from '#common/helpers';
import { Logger } from '#infrastructure/observability/logger';
import type { MailConfig } from '#config/mail';

export class MailDriverFactory {
  private static instance: IMailDriver | null = null;

  public static getDriver(): IMailDriver {
    if (this.instance) {
      return this.instance;
    }

    const mailCfg = config<MailConfig>('mail');
    const driver = mailCfg.driver;

    Logger.info(`[MailDriverFactory] Creating mail driver: ${driver}`);

    switch (driver) {
      case 'nodemailer':
        this.instance = new NodemailerDriver(mailCfg);
        break;
      case 'log':
        this.instance = new LogMailDriver();
        break;
      default:
        throw new Error(
          `Unsupported mail driver: ${driver}. Supported drivers: nodemailer, log`
        );
    }

    return this.instance;
  }
}
