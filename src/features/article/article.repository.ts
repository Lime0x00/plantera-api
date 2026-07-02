import { BaseRepository } from '#infrastructure/database/base-repository';
import {
  IArticleRepository,
  ArticleCreateInput,
  ArticleUpdateInput,
  ArticleWhereUniqueInput,
} from './article.repository.interface';
import { Article } from './domain';

export class ArticleRepository
  extends BaseRepository<
    Article,
    ArticleWhereUniqueInput,
    import('./article.types').ArticleWhereInput,
    ArticleCreateInput,
    ArticleUpdateInput
  >
  implements IArticleRepository
{
  public constructor() {
    super(Article);
  }
}
