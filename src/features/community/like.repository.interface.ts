import type {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  DeleteArgs,
} from '#common/types/database';
import type { LikeModel } from './domain/like.model';

export interface LikeWhereUniqueInput {
  id?: number;
  postId?: number;
  authorId?: number;
}

export interface LikeCreateInput {
  postId: number;
  authorId: number;
}

export interface ILikeRepository {
  create(args: CreateArgs<LikeCreateInput>): Promise<LikeModel>;
  findUnique(
    args: FindUniqueArgs<LikeWhereUniqueInput>
  ): Promise<LikeModel | null>;
  findMany(args?: FindManyArgs<Record<string, unknown>>): Promise<LikeModel[]>;
  delete(args: DeleteArgs<LikeWhereUniqueInput>): Promise<LikeModel>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  findByPostAndAuthor(
    postId: number,
    authorId: number
  ): Promise<LikeModel | null>;
  deleteByPostAndAuthor(
    postId: number,
    authorId: number
  ): Promise<LikeModel | null>;
}
