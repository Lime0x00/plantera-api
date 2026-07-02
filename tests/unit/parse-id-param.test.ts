import { describe, it, expect } from 'vitest';
import { parseIdParam } from '#common/helpers/params';
import { NotFoundError } from '#common/errors';

describe('parseIdParam', () => {
  it('parses a valid numeric string', () => {
    expect(parseIdParam('42')).toBe(42);
  });

  it('parses a valid string from an array', () => {
    expect(parseIdParam(['99'])).toBe(99);
  });

  it('throws NotFoundError for non-numeric string', () => {
    expect(() => parseIdParam('abc')).toThrow(NotFoundError);
  });

  it('throws NotFoundError for negative number', () => {
    expect(() => parseIdParam('-5')).toThrow(NotFoundError);
  });

  it('throws NotFoundError for zero', () => {
    expect(() => parseIdParam('0')).toThrow(NotFoundError);
  });

  it('throws NotFoundError for empty string', () => {
    expect(() => parseIdParam('')).toThrow(NotFoundError);
  });

  it('throws NotFoundError for undefined', () => {
    expect(() => parseIdParam(undefined)).toThrow(NotFoundError);
  });

  it('throws NotFoundError for empty array', () => {
    expect(() => parseIdParam([])).toThrow(NotFoundError);
  });

  it('throws NotFoundError for NaN string', () => {
    expect(() => parseIdParam('NaN')).toThrow(NotFoundError);
  });

  it('truncates float string to integer (parseInt behavior)', () => {
    expect(parseIdParam('3.14')).toBe(3);
  });

  it('uses first element from multi-element array', () => {
    expect(() => parseIdParam(['abc', '42'])).toThrow(NotFoundError);
  });
});
