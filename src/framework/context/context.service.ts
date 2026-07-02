import contextStorage from './context-storage';
import type { RequestContext } from './request-context';

export class ContextService {
  /**
   * Get the entire current context.
   */
  public static get(): RequestContext | undefined {
    return contextStorage.getStore();
  }

  /**
   * Get the current client IP address.
   */
  public static ip(): string | undefined {
    return this.get()?.ip;
  }

  /**
   * Get the current user ID.
   */
  public static userId(): string | undefined {
    return this.get()?.user?.id;
  }

  /**
   * Get the current request ID.
   */
  public static requestId(): string | undefined {
    return this.get()?.requestId;
  }

  /**
   * Get the current trace ID.
   */
  public static traceId(): string | undefined {
    return this.get()?.traceId || 'SYSTEM';
  }

  /**
   * Get the current locale from the request Accept-Language header.
   * Falls back to the configured default locale.
   */
  public static locale(): string {
    return this.get()?.locale || 'en';
  }
}
