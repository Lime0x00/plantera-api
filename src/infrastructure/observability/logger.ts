import { ContextService } from '../../framework/context/context.service';
import { config } from '#common/helpers';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ANSI escape codes for local terminal coloring
const COLORS = {
  RESET: '\x1b[0m',
  INFO: '\x1b[32m',
  WARN: '\x1b[33m',
  ERROR: '\x1b[31m',
  DEBUG: '\x1b[36m',
  GREY: '\x1b[90m',
};

export class Logger {
  private static formatMessage(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ) {
    const ctx = ContextService.get();

    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      traceId: ctx?.traceId || 'SYSTEM',
      userId: ctx?.user?.id || 'ANONYMOUS',
      clientIp: ctx?.ip || '0.0.0.0',
      action: 'N/A',
      message,
      ...(meta || {}),
    };
  }

  private static print(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ) {
    const formatted = this.formatMessage(level, message, meta);

    let logFormat = 'text';
    try {
      logFormat = config<string>('app.log_format', 'text');
    } catch {
      // Fallback if config is resolved during early bootstrapping
    }

    if (logFormat === 'json') {
      const consoleMethod = level === 'info' ? 'log' : level;
      console[consoleMethod as 'log' | 'warn' | 'error' | 'debug'](
        JSON.stringify(formatted)
      );
    } else {
      const color =
        COLORS[level.toUpperCase() as keyof typeof COLORS] || COLORS.RESET;
      const timestamp = new Date().toLocaleTimeString();
      const traceInfo =
        formatted.traceId !== 'SYSTEM' ? ` [Trace: ${formatted.traceId}]` : '';

      const textLog = `${COLORS.GREY}[${timestamp}]${COLORS.RESET} ${color}[${formatted.level}]${COLORS.RESET}${COLORS.GREY}${traceInfo}${COLORS.RESET}: ${formatted.message}`;

      const consoleMethod = level === 'info' ? 'log' : level;
      if (meta && Object.keys(meta).length > 0) {
        console[consoleMethod as 'log' | 'warn' | 'error' | 'debug'](
          textLog,
          meta
        );
      } else {
        console[consoleMethod as 'log' | 'warn' | 'error' | 'debug'](textLog);
      }
    }
  }

  public static info(message: string, meta?: Record<string, unknown>) {
    this.print('info', message, meta);
  }

  public static warn(message: string, meta?: Record<string, unknown>) {
    this.print('warn', message, meta);
  }

  public static error(message: string, meta?: Record<string, unknown>) {
    this.print('error', message, meta);
  }

  public static debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      this.print('debug', message, meta);
    }
  }
}

export default Logger;
