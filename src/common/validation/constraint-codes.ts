const CONSTRAINT_CODES: Record<string, string> = {
  isNotEmpty: 'REQUIRED',
  isDefined: 'REQUIRED',
  minLength: 'TOO_SHORT',
  length: 'TOO_SHORT',
  maxLength: 'TOO_LONG',
  isEmail: 'INVALID_FORMAT',
  matches: 'INVALID_FORMAT',
  isInt: 'INVALID_FORMAT',
  isNumber: 'INVALID_FORMAT',
  isString: 'INVALID_FORMAT',
  isBoolean: 'INVALID_FORMAT',
};

export function resolveErrorCode(constraint: string): string {
  return CONSTRAINT_CODES[constraint] ?? 'INVALID_FORMAT';
}
