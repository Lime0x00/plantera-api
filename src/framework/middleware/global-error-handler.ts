import type { ErrorRequestHandler } from 'express';
import { AppError } from '#common/errors';
import { Logger } from '#infrastructure/observability/logger';

const STATUS_TO_ERROR: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  const isAppError = error instanceof AppError;

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      errorCode: 'BAD_REQUEST',
      message: 'Invalid JSON in request body',
      error: 'Bad Request',
    });
  }

  const statusCode = isAppError ? error.statusCode : 500;
  const errorCode = isAppError ? error.errorCode : 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500) {
    Logger.error(
      `[${errorCode}] ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack, name: error.name }
            : error,
      }
    );
  }

  const response: Record<string, unknown> = {
    success: false,
    errorCode,
    message: error instanceof Error ? error.message : 'Internal Server Error',
    error: STATUS_TO_ERROR[statusCode] ?? 'Internal Server Error',
  };

  if (isAppError && error.details !== undefined) {
    response.details = error.details;
  }

  return res.status(statusCode).json(response);
};
