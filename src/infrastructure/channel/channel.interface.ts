export interface ChannelPayload {
  subject?: string;
  body?: string;
  template?: string;
  templateData?: Record<string, unknown>;
}

export interface IChannelDriver {
  send(to: string, payload: ChannelPayload): Promise<void>;
}
