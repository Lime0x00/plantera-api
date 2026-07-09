import { Resource } from '#common/types/http/resources';
import type { Post } from '../domain/community.model';
import { User } from '#features/user/domain/user.model';

interface PostResourceOutput {
  id: number;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  imageUrl: string | null;
  published: boolean;
  author: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  commentCount: number;
  likesCount: number;
  liked: boolean;
  createdAt: Date;
}

export class PostResource extends Resource<
  Post & { author?: any; _count?: { comments?: number; likes?: number }; liked?: boolean },
  PostResourceOutput
> {
  protected transform(
    entity: Post & {
      author?: any;
      _count?: { comments?: number; likes?: number };
      liked?: boolean;
    }
  ): PostResourceOutput {
    return {
      id: entity.id,
      title: entity.title,
      content: entity.content,
      category: entity.category ?? null,
      tags: entity.tags ?? null,
      imageUrl: entity.resolveImageUrl() ?? null,
      published: entity.published,
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
      commentCount: entity._count?.comments ?? 0,
      likesCount: entity._count?.likes ?? 0,
      liked: entity.liked ?? false,
      createdAt: entity.createdAt!,
    };
  }
}
