import { BaseModel } from '#framework/domain/base-model';

export class RefreshTokenModel extends BaseModel {
  static modelKey = 'refreshToken';

  userId!: number;
  tokenHash!: string;
  expiresAt!: Date;
  revokedAt!: Date | null;
}
