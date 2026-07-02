import { Resource } from '#common/types/http/resources';
import { Article } from '#features/article/domain/article.model';
import { User } from '#features/user/domain/user.model';

export type ArticleSchema = {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  imageUrl: string | null;
  published: boolean;
  author: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
};

export class ArticleResource extends Resource<
  Article & { author?: any },
  ArticleSchema
> {
  protected transform(entity: Article & { author?: any }): ArticleSchema {
    return {
      id: entity.id!,
      title: entity.title ?? '',
      content: entity.content ?? '',
      excerpt: entity.excerpt ?? null,
      category: entity.category ?? null,
      imageUrl: entity.resolveImageUrl(),
      published: entity.published ?? false,
      author: entity.author
        ? {
            id: entity.author.id,
            userName: entity.author.userName,
            firstName: entity.author.firstName,
            lastName: entity.author.lastName,
            avatarUrl: User.resolveAvatarFrom(entity.author),
          }
        : {
            id: entity.authorId!,
            userName: '',
            firstName: '',
            lastName: '',
            avatarUrl: null,
          },
      createdAt: entity.createdAt ?? new Date(),
    };
  }
}
