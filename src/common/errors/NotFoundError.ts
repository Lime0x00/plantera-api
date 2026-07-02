import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export class NotFoundError<TDetails = unknown> extends AppError<TDetails> {
  constructor(message?: string, details?: TDetails) {
    super(
      ErrorCodes.RESOURCE_NOT_FOUND,
      message || 'Resource not found',
      details
    );
  }
}
