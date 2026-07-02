import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export class MethodNotAllowedError extends AppError<never> {
  constructor(message?: string) {
    super(
      ErrorCodes.METHOD_NOT_ALLOWED,
      message || 'The HTTP method used is not supported by this resource.'
    );
  }
}
