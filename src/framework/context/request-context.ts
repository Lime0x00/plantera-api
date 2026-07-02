export interface RequestContext {
  requestId: string;
  user?: {
    id: string;
    role: string;
  };
  ip?: string;
  traceId?: string;
  userAgent?: string;
  locale?: string;
}
