export interface CanLoginResult {
  allowed: boolean;
  retryAfterMinutes?: number;
  reason?: string;
}

export class AuthPolicy {
  canCreate() {
    return true;
  }

  canView() {
    return true;
  }

  canUpdate() {
    return true;
  }

  canDelete() {
    return true;
  }

  canLogin(user: { lockedUntil?: Date | null }): CanLoginResult {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const retryAfterMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      return {
        allowed: false,
        retryAfterMinutes,
        reason: `Account temporarily locked. Try again in ${retryAfterMinutes} minutes.`,
      };
    }
    return { allowed: true };
  }
}
