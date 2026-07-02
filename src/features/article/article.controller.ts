import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import { parsePagination, parseIdParam } from '#common/helpers';

import { ArticleService } from './article.service';
import { ArticleResource } from './resources';

interface ArticleControllerDeps {
  services: { articleService: ArticleService };
}

export class ArticleController extends Controller {
  #service: ArticleService;
  #resource = new ArticleResource();

  constructor({ services: { articleService } }: ArticleControllerDeps) {
    super();
    this.#service = articleService;
  }

  public async create(req: Request, res: Response, next: NextFunction) {
    return this.run(next, async () => {
      const result = await this.#service.create(
        { ...req.body, authorId: req.user!.userId },
        req.user!.userId,
        req.user!.role
      );
      return this.created(
        res,
        this.#resource.make(result),
        'Article created successfully'
      );
    });
  }

  public async findAll(req: Request, res: Response, next: NextFunction) {
    return this.run(next, async () => {
      const { page, limit } = parsePagination(req);
      const result = await this.#service.findAllPublished(page, limit);
      return this.ok(
        res,
        {
          data: this.#resource.collection(result.data),
          meta: {
            page,
            limit,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / limit),
          },
        },
        'Articles retrieved successfully'
      );
    });
  }

  public async findById(req: Request, res: Response, next: NextFunction) {
    return this.run(next, async () => {
      const id = parseIdParam(req.params.id);
      const result = await this.#service.findById(id);
      return this.ok(
        res,
        this.#resource.make(result),
        'Article retrieved successfully'
      );
    });
  }

  public async update(req: Request, res: Response, next: NextFunction) {
    return this.run(next, async () => {
      const id = parseIdParam(req.params.id);
      const result = await this.#service.update(
        id,
        req.body,
        req.user!.userId,
        req.user!.role
      );
      return this.ok(
        res,
        this.#resource.make(result),
        'Article updated successfully'
      );
    });
  }

  public async delete(req: Request, res: Response, next: NextFunction) {
    return this.run(next, async () => {
      const id = parseIdParam(req.params.id);
      await this.#service.delete(id, req.user!.userId, req.user!.role);
      return this.ok(res, {}, 'Article deleted successfully');
    });
  }
}
