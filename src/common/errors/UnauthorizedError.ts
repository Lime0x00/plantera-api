import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export class UnauthorizedError<TDetails = unknown> extends AppError<TDetails> {
  constructor(message?: string, details?: TDetails) {
    super(ErrorCodes.UNAUTHORIZED, message || 'Unauthorized', details);
  }
}
