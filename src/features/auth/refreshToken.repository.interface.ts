import type { RefreshTokenModel } from './domain/refreshToken.model';
import type { FindUniqueArgs, UpdateArgs } from '#common/types';

export interface IRefreshTokenRepository {
  create(args: {
    data: { userId: number; tokenHash: string; expiresAt: Date };
  }): Promise<RefreshTokenModel>;
  findUnique(
    args: FindUniqueArgs<{ id?: number; tokenHash?: string }>
  ): Promise<RefreshTokenModel | null>;
  update(
    args: UpdateArgs<{ id?: number }, { revokedAt?: Date | null }>
  ): Promise<RefreshTokenModel>;
}
