import nodemailer from 'nodemailer';
import type { IMailDriver, SendMailOptions } from './../mail-driver.interface';
import type { MailConfig } from '#config/mail';

export class NodemailerDriver implements IMailDriver {
  private transporter: nodemailer.Transporter;

  constructor(private config: MailConfig) {
    const encryption = (config.encryption ?? '').toLowerCase();
    const transportOptions: Record<string, unknown> = {
      host: config.host,
      port: config.port,
      secure: encryption === 'tls' || encryption === 'ssl',
      ignoreTLS: encryption === 'none',
      connectionTimeout: config.timeout,
    };
    if (config.auth?.user && config.auth?.pass) {
      transportOptions.auth = {
        user: config.auth.user,
        pass: config.auth.pass,
      };
    }
    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  async connect(): Promise<void> {
    await this.transporter.verify();
  }

  async disconnect(): Promise<void> {
    this.transporter.close();
  }
}
