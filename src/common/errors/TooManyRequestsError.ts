import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export interface RateLimitDetails {
  retryAfterMinutes?: number;
}

export class TooManyRequestsError extends AppError<RateLimitDetails> {
  constructor(message?: string, details?: RateLimitDetails) {
    super(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      message || 'Rate limit exceeded. Please try again later.',
      details
    );
  }
}
