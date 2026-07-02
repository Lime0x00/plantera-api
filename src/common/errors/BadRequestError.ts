import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export class BadRequestError<TDetails = unknown> extends AppError<TDetails> {
  constructor(message?: string, details?: TDetails) {
    super(ErrorCodes.BAD_REQUEST, message || 'Bad request', details);
  }
}
