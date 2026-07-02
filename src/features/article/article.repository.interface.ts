import type {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  UpdateArgs,
  DeleteArgs,
} from '#common/types/database';
import type { Article } from './domain';

export interface ArticleWhereUniqueInput {
  id?: number;
}

export interface ArticleCreateInput {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  published?: boolean;
  authorId: number;
}

export interface ArticleUpdateInput {
  title?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string;
  published?: boolean;
}

export interface IArticleRepository {
  create(args: CreateArgs<ArticleCreateInput>): Promise<Article>;
  findUnique(
    args: FindUniqueArgs<ArticleWhereUniqueInput>
  ): Promise<Article | null>;
  findMany(args?: FindManyArgs<ArticleWhereUniqueInput>): Promise<Article[]>;
  update(
    args: UpdateArgs<ArticleWhereUniqueInput, ArticleUpdateInput>
  ): Promise<Article>;
  delete(args: DeleteArgs<ArticleWhereUniqueInput>): Promise<Article>;
  count(args?: FindManyArgs<ArticleWhereUniqueInput>): Promise<number>;
}
