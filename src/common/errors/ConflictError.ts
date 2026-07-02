import { AppError } from './AppError';
import { ErrorCodes } from '#common/constants';

export interface FieldConflictDetail {
  code: string;
  message: string;
  retryAfterMinutes?: number;
}

export type ConflictDetails = Record<string, FieldConflictDetail>;

export class ConflictError extends AppError<ConflictDetails> {
  constructor(message?: string, details?: ConflictDetails) {
    super(ErrorCodes.CONFLICT, message || 'Resource conflict', details);
  }
}
