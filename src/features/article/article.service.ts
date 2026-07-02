import { NotFoundError, ForbiddenError } from '#common/errors';
import type {
  IArticleRepository,
  ArticleCreateInput,
  ArticleUpdateInput,
} from './article.repository.interface';
import { ArticlePolicy } from './article.policy';
import { ARTICLE_ERRORS } from './article.messages';

const ARTICLE_INCLUDE = {
  author: {
    select: {
      id: true,
      userName: true,
      firstName: true,
      lastName: true,
      storageDisk: true,
      storagePath: true,
    },
  },
} as const;

interface ArticleServiceDeps {
  policies: { articlePolicy: ArticlePolicy };
  repositories: { articleRepository: IArticleRepository };
}

export class ArticleService {
  #repository: IArticleRepository;
  #policy: ArticlePolicy;

  constructor({
    policies: { articlePolicy },
    repositories: { articleRepository },
  }: ArticleServiceDeps) {
    this.#policy = articlePolicy;
    this.#repository = articleRepository;
  }

  async findAllPublished(page: number, limit: number) {
    const [data, totalCount] = await Promise.all([
      this.#repository.findMany({
        where: { published: true } as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: ARTICLE_INCLUDE,
      }),
      this.#repository.count({ where: { published: true } as any }),
    ]);
    return { data, totalCount };
  }

  async findById(id: number) {
    const article = await this.#repository.findUnique({
      where: { id },
      include: ARTICLE_INCLUDE,
    });
    if (!article) {
      throw new NotFoundError(ARTICLE_ERRORS.NOT_FOUND);
    }
    return article;
  }

  async create(dto: ArticleCreateInput, userId: number, userRole: string) {
    if (!this.#policy.canCreate({ id: userId, role: userRole })) {
      throw new ForbiddenError(ARTICLE_ERRORS.FORBIDDEN);
    }
    return this.#repository.create({
      data: { ...dto, authorId: userId },
      include: ARTICLE_INCLUDE,
    });
  }

  async update(
    id: number,
    dto: ArticleUpdateInput,
    userId: number,
    userRole: string
  ) {
    const article = await this.findById(id);
    if (
      !this.#policy.canUpdate({ id: userId, role: userRole }, article.authorId)
    ) {
      throw new ForbiddenError(ARTICLE_ERRORS.FORBIDDEN);
    }
    return this.#repository.update({
      where: { id },
      data: dto,
      include: ARTICLE_INCLUDE,
    });
  }

  async delete(id: number, userId: number, userRole: string) {
    const article = await this.findById(id);
    if (
      !this.#policy.canDelete({ id: userId, role: userRole }, article.authorId)
    ) {
      throw new ForbiddenError(ARTICLE_ERRORS.FORBIDDEN);
    }
    return this.#repository.delete({ where: { id } });
  }
}
