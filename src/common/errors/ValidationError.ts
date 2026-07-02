import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export interface FieldValidationErrorDetail {
  code: string;
  message: string;
}

export type ValidationErrorDetails = Record<string, FieldValidationErrorDetail>;

export class ValidationError extends AppError<ValidationErrorDetails> {
  constructor(message?: string, details?: ValidationErrorDetails) {
    super(
      ErrorCodes.VALIDATION_FAILED,
      message || 'Validation failed',
      details
    );
  }
}
