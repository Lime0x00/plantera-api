import { describe, it, expect } from 'vitest';
import { resolveErrorCode } from '#common/validation/constraint-codes';

describe('resolveErrorCode', () => {
  it('maps isNotEmpty to REQUIRED', () => {
    expect(resolveErrorCode('isNotEmpty')).toBe('REQUIRED');
  });

  it('maps isDefined to REQUIRED', () => {
    expect(resolveErrorCode('isDefined')).toBe('REQUIRED');
  });

  it('maps minLength to TOO_SHORT', () => {
    expect(resolveErrorCode('minLength')).toBe('TOO_SHORT');
  });

  it('maps isEmail to INVALID_FORMAT', () => {
    expect(resolveErrorCode('isEmail')).toBe('INVALID_FORMAT');
  });

  it('maps isInt to INVALID_FORMAT', () => {
    expect(resolveErrorCode('isInt')).toBe('INVALID_FORMAT');
  });

  it('maps unknown constraint to INVALID_FORMAT', () => {
    expect(resolveErrorCode('unknownConstraint')).toBe('INVALID_FORMAT');
  });

  it('maps empty string to INVALID_FORMAT', () => {
    expect(resolveErrorCode('')).toBe('INVALID_FORMAT');
  });
});
