import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AuthPolicy } from '#features/auth/auth.policy';

describe('AuthPolicy', () => {
  let policy: AuthPolicy;

  beforeEach(() => {
    vi.useFakeTimers();
    policy = new AuthPolicy();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('canLogin', () => {
    it('should allow login when lockedUntil is null', () => {
      const result = policy.canLogin({ lockedUntil: null });
      expect(result.allowed).toBe(true);
    });

    it('should allow login when lockedUntil is undefined', () => {
      const result = policy.canLogin({});
      expect(result.allowed).toBe(true);
    });

    it('should allow login when lockedUntil is in the past', () => {
      const past = new Date(Date.now() - 60 * 1000);
      const result = policy.canLogin({ lockedUntil: past });
      expect(result.allowed).toBe(true);
    });

    it('should deny login when lockedUntil is in the future', () => {
      const future = new Date(Date.now() + 60 * 1000);
      const result = policy.canLogin({ lockedUntil: future });
      expect(result.allowed).toBe(false);
    });

    it('should include retryAfterMinutes on lockout', () => {
      const future = new Date(Date.now() + 10 * 60 * 1000);
      const result = policy.canLogin({ lockedUntil: future });
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMinutes).toBe(10);
    });

    it('should include reason string on lockout', () => {
      const future = new Date(Date.now() + 5 * 60 * 1000);
      const result = policy.canLogin({ lockedUntil: future });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Account temporarily locked');
      expect(result.reason).toContain('5 minutes');
    });

    it('should round up retryAfterMinutes to the nearest integer', () => {
      const future = new Date(Date.now() + 90 * 1000);
      const result = policy.canLogin({ lockedUntil: future });
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMinutes).toBe(2);
    });
  });

  describe('default policies', () => {
    it('should allow all by default', () => {
      expect(policy.canCreate()).toBe(true);
      expect(policy.canView()).toBe(true);
      expect(policy.canUpdate()).toBe(true);
      expect(policy.canDelete()).toBe(true);
    });
  });
});
