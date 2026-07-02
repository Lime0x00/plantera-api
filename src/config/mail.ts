import { env } from '#common/env';

export type MailDriver = 'nodemailer' | 'log';

export type MailConfig = {
  driver: MailDriver;
  host: string;
  port: number;
  timeout: number;
  encryption: string;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
};

export const mailConfig: MailConfig = {
  driver: env<MailDriver>('MAIL_DRIVER', 'nodemailer'),
  host: env<string>('MAIL_HOST', ''),
  port: env<number>('MAIL_PORT', 587),
  timeout: env<number>('MAIL_TIMEOUT', 5000),
  encryption: env<string>('MAIL_ENCRYPTION', 'tls'),
  auth: {
    user: env<string>('MAIL_USER', ''),
    pass: env<string>('MAIL_PASS', ''),
  },
  from: {
    name: env<string>('MAIL_FROM_NAME', ''),
    email: env<string>('MAIL_FROM_EMAIL', ''),
  },
};
