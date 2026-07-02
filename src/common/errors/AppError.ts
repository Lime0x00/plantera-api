import type { ErrorCode } from '#common/constants';
import { StatusMap } from '#common/constants';

export class AppError<TDetails = unknown> extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: TDetails;

  constructor(errorCode: ErrorCode, message?: string, details?: TDetails) {
    super(
      message ||
        errorCode.charAt(0) +
          errorCode.slice(1).toLowerCase().replace(/_/g, ' ')
    );
    this.statusCode = StatusMap[errorCode];
    this.errorCode = errorCode;
    this.details = details as TDetails;
    Error.captureStackTrace(this, this.constructor);
  }
}
