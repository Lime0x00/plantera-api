import { BaseRepository } from '#infrastructure/database/base-repository';
import { RefreshTokenModel } from './domain/refreshToken.model';
import type { IRefreshTokenRepository } from './refreshToken.repository.interface';

interface RefreshTokenWhereUnique {
  id?: number;
  tokenHash?: string;
}
interface RefreshTokenWhereMany {
  userId?: number;
}
type RefreshTokenCreate = {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
};
type RefreshTokenUpdate = { revokedAt?: Date | null };

export class RefreshTokenRepository
  extends BaseRepository<
    RefreshTokenModel,
    RefreshTokenWhereUnique,
    RefreshTokenWhereMany,
    RefreshTokenCreate,
    RefreshTokenUpdate
  >
  implements IRefreshTokenRepository
{
  constructor() {
    super(RefreshTokenModel);
  }
}
