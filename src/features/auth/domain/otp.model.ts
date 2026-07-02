import { BaseModel } from '#framework/domain/base-model';

export class OtpModel extends BaseModel {
  static modelKey = 'otp';

  email!: string;
  code!: string;
  channel!: string;
  type!: string;
  expiresAt!: Date;
  usedAt?: Date | null;
}
