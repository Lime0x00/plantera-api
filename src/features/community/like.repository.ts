import { BaseRepository } from '#infrastructure/database/base-repository';
import { LikeModel } from './domain/like.model';
import {
  ILikeRepository,
  LikeCreateInput,
  LikeWhereUniqueInput,
} from './like.repository.interface';

export class LikeRepository
  extends BaseRepository<
    LikeModel,
    LikeWhereUniqueInput,
    Record<string, unknown>,
    LikeCreateInput,
    Record<string, unknown>
  >
  implements ILikeRepository
{
  public constructor() {
    super(LikeModel);
  }

  async findByPostAndAuthor(
    postId: number,
    authorId: number
  ): Promise<LikeModel | null> {
    const result = await this.findMany({ where: { postId, authorId } }, 'withoutTrashed');
    return result[0] || null;
  }

  async findDeletedByPostAndAuthor(
    postId: number,
    authorId: number
  ): Promise<LikeModel | null> {
    const result = await this.findMany({ where: { postId, authorId } }, 'onlyTrashed');
    return result[0] || null;
  }

  async restoreByPostAndAuthor(
    postId: number,
    authorId: number
  ): Promise<LikeModel | null> {
    const existing = await this.findDeletedByPostAndAuthor(postId, authorId);
    if (!existing) return null;
    return this.restore({ where: { id: existing.id } });
  }

  async deleteByPostAndAuthor(
    postId: number,
    authorId: number
  ): Promise<LikeModel | null> {
    const existing = await this.findByPostAndAuthor(postId, authorId);
    if (!existing) return null;
    return this.delete({ where: { id: existing.id } });
  }
}
