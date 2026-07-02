import { Resource } from '#common/types/http/resources';
import type { CommentModel } from '../domain/comment.model';
import { User } from '#features/user/domain/user.model';

interface CommentResourceOutput {
  id: number;
  content: string;
  author: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
}

export class CommentResource extends Resource<
  CommentModel & { author?: any },
  CommentResourceOutput
> {
  protected transform(
    entity: CommentModel & { author?: any }
  ): CommentResourceOutput {
    return {
      id: entity.id,
      content: entity.content,
      author: entity.author
        ? {
            id: entity.author.id,
            userName: entity.author.userName,
            firstName: entity.author.firstName,
            lastName: entity.author.lastName,
            avatarUrl: User.resolveAvatarFrom(entity.author),
          }
        : {
            id: entity.authorId,
            userName: '',
            firstName: '',
            lastName: '',
            avatarUrl: null,
          },
      createdAt: entity.createdAt!,
    };
  }
}
