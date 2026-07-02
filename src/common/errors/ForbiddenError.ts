import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export class ForbiddenError extends AppError<never> {
  constructor(message?: string) {
    super(ErrorCodes.FORBIDDEN, message || 'Forbidden');
  }
}
