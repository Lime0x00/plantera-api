import type { User } from '#features/user/domain';

export interface IAuthObserver {
  onLoginSuccess?: (user: User) => Promise<void> | void;
  updated?: (entity: User) => Promise<void> | void;
}
