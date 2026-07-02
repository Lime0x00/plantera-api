import { BaseModel } from '#framework/domain/base-model';

export class Auth extends BaseModel {
  static modelKey = 'user';

  email!: string;
  firstName!: string;
  lastName!: string;
  userName!: string;
  password!: string;
  timezone?: string | null;
  pushToken?: string | null;
  failedLoginAttempts!: number;
  lockedUntil?: Date | null;
}
