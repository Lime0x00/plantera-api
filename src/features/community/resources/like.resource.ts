import { Resource } from '#common/types/http/resources';
import type { LikeModel } from './../domain/like.model';
import { User } from '#features/user/domain/user.model';

interface LikeResourceOutput {
  id: number;
  author: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
}

export class LikeResource extends Resource<
  LikeModel & { author?: any },
  LikeResourceOutput
> {
  protected transform(
    entity: LikeModel & { author?: any }
  ): LikeResourceOutput {
    return {
      id: entity.id,
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
