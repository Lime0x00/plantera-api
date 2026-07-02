import { Router } from 'express';
import { container } from '#app/container';
import type { ArticleController } from './article.controller';
import { validateDto } from '#framework/middleware/validation.middleware';
import {
  authenticate,
  requireAdmin,
} from '#framework/middleware/auth.middleware';
import { CreateArticleDto } from './dtos/create.dto';
import { UpdateArticleDto } from './dtos/update.dto';

const articleRouter = Router();

articleRouter.get('/', (req, res, next) =>
  container
    .resolve<ArticleController>('articleController')
    .findAll(req, res, next)
);

articleRouter.get('/:id', (req, res, next) =>
  container
    .resolve<ArticleController>('articleController')
    .findById(req, res, next)
);

articleRouter.post(
  '/',
  authenticate,
  requireAdmin,
  validateDto(CreateArticleDto),
  (req, res, next) =>
    container
      .resolve<ArticleController>('articleController')
      .create(req, res, next)
);

articleRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validateDto(UpdateArticleDto),
  (req, res, next) =>
    container
      .resolve<ArticleController>('articleController')
      .update(req, res, next)
);

articleRouter.delete('/:id', authenticate, requireAdmin, (req, res, next) =>
  container
    .resolve<ArticleController>('articleController')
    .delete(req, res, next)
);

export { articleRouter };
