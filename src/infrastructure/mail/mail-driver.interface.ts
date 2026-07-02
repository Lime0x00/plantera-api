export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string | undefined;
  html?: string | undefined;
}

export interface IMailDriver {
  send(options: SendMailOptions): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
