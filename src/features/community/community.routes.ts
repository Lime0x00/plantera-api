import { Router } from 'express';
import { container } from '#app/container';
import type { CommunityController } from './community.controller';
import { validateDto } from '#framework/middleware/validation.middleware';
import { authenticate } from '#framework/middleware/auth.middleware';
import { CreateCommunityDto } from './dtos/create.dto';
import { UpdateCommunityDto } from './dtos/update.dto';
import { CreateCommentDto } from './dtos/comment.dto';
import { upload } from '#framework/middleware/upload.middleware';

const communityRouter = Router();

const communityController = container.resolve<CommunityController>(
  'communityController'
);
communityRouter.get('/', communityController.findAll);

communityRouter.get('/:id', (req, res, next) =>
  container
    .resolve<CommunityController>('communityController')
    .findById(req, res, next)
);

communityRouter.post(
  '/',
  authenticate,
  upload.single('image'),
  (req, res, next) =>
    container
      .resolve<CommunityController>('communityController')
      .create(req, res, next)
);

communityRouter.patch(
  '/:id',
  authenticate,
  validateDto(UpdateCommunityDto),
  (req, res, next) =>
    container
      .resolve<CommunityController>('communityController')
      .update(req, res, next)
);

communityRouter.delete('/:id', authenticate, (req, res, next) =>
  container
    .resolve<CommunityController>('communityController')
    .delete(req, res, next)
);

communityRouter.get('/:postId/comments', authenticate, (req, res, next) =>
  container
    .resolve<CommunityController>('communityController')
    .listComments(req, res, next)
);

communityRouter.post(
  '/:postId/comments',
  authenticate,
  validateDto(CreateCommentDto),
  (req, res, next) =>
    container
      .resolve<CommunityController>('communityController')
      .createComment(req, res, next)
);

communityRouter.delete('/comments/:commentId', authenticate, (req, res, next) =>
  container
    .resolve<CommunityController>('communityController')
    .deleteComment(req, res, next)
);

communityRouter.post('/:postId/like', authenticate, (req, res, next) =>
  container
    .resolve<CommunityController>('communityController')
    .toggleLike(req, res, next)
);

communityRouter.post(
  '/:postId/image',
  authenticate,
  upload.single('image'),
  (req, res, next) =>
    container
      .resolve<CommunityController>('communityController')
      .uploadImage(req, res, next)
);

communityRouter.get('/:postId/likes', authenticate, (req, res, next) =>
  container
    .resolve<CommunityController>('communityController')
    .getPostLikes(req, res, next)
);

export { communityRouter };
