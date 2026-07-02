import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export class UnsupportedMediaTypeError extends AppError<never> {
  constructor(message?: string) {
    super(
      ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
      message || 'The Content-Type header is invalid or unsupported.'
    );
  }
}
