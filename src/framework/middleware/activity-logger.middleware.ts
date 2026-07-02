import type { Request, Response, NextFunction } from 'express';
import { Logger } from '#infrastructure/observability/logger';
import { ContextService } from '#framework/context/context.service';
import { config } from '#common/helpers';

// ANSI escape codes for local terminal coloring
const ANSI_RESET = '\x1b[0m';
const ANSI_GREEN = '\x1b[32m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_RED = '\x1b[31m';
const ANSI_CYAN = '\x1b[36m';
const ANSI_MAGENTA = '\x1b[35m';
const ANSI_BLUE = '\x1b[34m';

export function activityLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const method = req.method;
    const endpoint = req.originalUrl || req.url;
    const user = ContextService.userId() || 'ANONYMOUS';
    const status = res.statusCode;

    const isTextFormat = config('app.log_format', 'text') === 'text';

    let methodColored = method;
    let userColored = user;
    let statusColored = String(status);
    let durationColored = `${duration}ms`;

    if (isTextFormat) {
      let methodColor = ANSI_RESET;
      switch (method.toUpperCase()) {
        case 'GET':
          methodColor = ANSI_GREEN;
          break;
        case 'POST':
          methodColor = ANSI_BLUE;
          break;
        case 'PUT':
        case 'PATCH':
          methodColor = ANSI_YELLOW;
          break;
        case 'DELETE':
          methodColor = ANSI_RED;
          break;
        case 'HEAD':
        case 'OPTIONS':
          methodColor = ANSI_MAGENTA;
          break;
      }
      methodColored = `${methodColor}${method}${ANSI_RESET}`;

      userColored = `${ANSI_CYAN}${user}${ANSI_RESET}`;

      let statusColor = ANSI_RESET;
      if (status >= 500) {
        statusColor = ANSI_RED;
      } else if (status >= 400) {
        statusColor = ANSI_YELLOW;
      } else if (status >= 300) {
        statusColor = ANSI_CYAN;
      } else if (status >= 200) {
        statusColor = ANSI_GREEN;
      }
      statusColored = `${statusColor}${status}${ANSI_RESET}`;

      let durationColor = ANSI_GREEN;
      if (duration > 500) {
        durationColor = ANSI_RED;
      } else if (duration > 200) {
        durationColor = ANSI_YELLOW;
      }
      durationColored = `${durationColor}${duration}ms${ANSI_RESET}`;
    }

    Logger.info(
      `${methodColored} ${endpoint} - User: ${userColored} - Status: ${statusColored} - ${durationColored}`
    );
  });

  next();
}
