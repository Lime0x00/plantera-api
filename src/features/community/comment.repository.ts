import { BaseRepository } from '#infrastructure/database/base-repository';
import type { CommentModel } from './domain/comment.model';
import {
  ICommentRepository,
  CommentCreateInput,
  CommentWhereUniqueInput,
} from './comment.repository.interface';
import { CommentModel as CommentModelClass } from './domain/comment.model';

export class CommentRepository
  extends BaseRepository<
    CommentModel,
    CommentWhereUniqueInput,
    Record<string, unknown>,
    CommentCreateInput,
    Record<string, unknown>
  >
  implements ICommentRepository
{
  public constructor() {
    super(CommentModelClass);
  }
}
