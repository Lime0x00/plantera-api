import type {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  DeleteArgs,
} from '#common/types/database';
import type { CommentModel } from './domain/comment.model';

export interface CommentWhereUniqueInput {
  id?: number;
}

export interface CommentCreateInput {
  content: string;
  postId: number;
  authorId: number;
}

export interface ICommentRepository {
  create(args: CreateArgs<CommentCreateInput>): Promise<CommentModel>;
  findUnique(
    args: FindUniqueArgs<CommentWhereUniqueInput>
  ): Promise<CommentModel | null>;
  findMany(
    args?: FindManyArgs<Record<string, unknown>>
  ): Promise<CommentModel[]>;
  delete(args: DeleteArgs<CommentWhereUniqueInput>): Promise<CommentModel>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}
