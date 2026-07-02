import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env } from '#common/env';

describe('env helper', () => {
  beforeEach(() => {
    vi.stubEnv('TEST_VAR', 'hello');
    vi.stubEnv('TEST_BOOL_TRUE', 'true');
    vi.stubEnv('TEST_BOOL_FALSE', 'false');
    vi.stubEnv('TEST_NUM', '123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads string environment variables', () => {
    expect(env('TEST_VAR')).toBe('hello');
  });

  it('returns fallback value if variable is missing', () => {
    expect(env('MISSING_VAR', 'fallback')).toBe('fallback');
  });

  it('casts true and false strings to booleans', () => {
    expect(env('TEST_BOOL_TRUE')).toBe(true);
    expect(env('TEST_BOOL_FALSE')).toBe(false);
  });

  it('casts numeric strings to numbers', () => {
    expect(env('TEST_NUM')).toBe(123);
  });
});
