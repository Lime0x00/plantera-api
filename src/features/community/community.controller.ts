import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import { parseIdParam, clampLimit } from '#common/helpers';

import { CommunityService } from './community.service';
import { PostResource, CommentResource, LikeResource } from './resources';
import { container } from '#app/container';
import { StorageService } from '#infrastructure/storage/storage.service';
import { StoragePathResolver } from '#infrastructure/storage/storage-path.resolver';
import { Post } from './domain/community.model';

interface CommunityControllerDeps {
  services: { communityService: CommunityService };
}

export class CommunityController extends Controller {
  #service: CommunityService;
  #postResource = new PostResource();
  #commentResource = new CommentResource();
  #likeResource = new LikeResource();

  constructor({ services: { communityService } }: CommunityControllerDeps) {
    super();
    this.#service = communityService;
  }

  public async create(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      let storageDisk: string | undefined;
      let storagePath: string | undefined;

      if (req.file) {
        const storageService = container.resolve<StorageService>('storageService');
        const post = new Post();
        post.id = Date.now();
        const ext = req.file.mimetype.split('/')[1] || 'jpg';
        const path = StoragePathResolver.forModel(post, ext);

        const result = await storageService.upload(path, {
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          filename: req.file.originalname,
          size: req.file.size,
        });

        storageDisk = result.disk;
        storagePath = result.path;
      }

      const result = await this.#service.create(
        {
          ...req.body,
          authorId: req.user!.userId,
          storageDisk,
          storagePath,
        },
        req.user!.userId,
        req.user!.role
      );
      return super.created(
        res,
        this.#postResource.make(result),
        'Post created successfully'
      );
    });
  }

  public async findAll(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const cursor = req.query.cursor
        ? parseInt(req.query.cursor as string)
        : undefined;
      const limit = clampLimit(
        req.query.limit ? parseInt(req.query.limit as string) : 20
      );
      const viewerId = req.user?.userId;
      const result = await this.#service.findAllPublished(cursor, limit, viewerId);
      return super.ok(
        res,
        {
          data: this.#postResource.collection(result.data),
          meta: result.meta,
        },
        'Posts retrieved successfully'
      );
    });
  }

  public async findById(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const id = parseIdParam(req.params.id);
      const result = await this.#service.findById(id);
      return super.ok(
        res,
        this.#postResource.make(result),
        'Post retrieved successfully'
      );
    });
  }

  public async update(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const id = parseIdParam(req.params.id);
      const result = await this.#service.update(
        id,
        req.body,
        req.user!.userId,
        req.user!.role
      );
      return super.ok(
        res,
        this.#postResource.make(result),
        'Post updated successfully'
      );
    });
  }

  public async delete(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const id = parseIdParam(req.params.id);
      await this.#service.delete(id, req.user!.userId, req.user!.role);
      return super.ok(res, {}, 'Post deleted successfully');
    });
  }

  public async createComment(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const postId = parseIdParam(req.params.postId);
      const result = await this.#service.createComment(postId, {
        content: req.body.content,
        authorId: req.user!.userId,
      });
      return super.created(
        res,
        this.#commentResource.make(result),
        'Comment added successfully.'
      );
    });
  }

  public async listComments(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const postId = parseIdParam(req.params.postId);
      const cursor = req.query.cursor
        ? parseInt(req.query.cursor as string)
        : undefined;
      const limit = clampLimit(
        req.query.limit ? parseInt(req.query.limit as string) : 20
      );
      const result = await this.#service.listComments(postId, cursor, limit);
      return super.ok(
        res,
        {
          data: this.#commentResource.collection(result.data),
          meta: result.meta,
        },
        'Comments retrieved successfully.'
      );
    });
  }

  public async deleteComment(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const commentId = parseIdParam(req.params.commentId);
      await this.#service.deleteComment(
        commentId,
        req.user!.userId,
        req.user!.role
      );
      return super.ok(res, {}, 'Comment deleted successfully.');
    });
  }

  public async uploadImage(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const postId = parseIdParam(req.params.postId);
      if (!req.file) {
        return super.badRequest(res, 'No image file provided');
      }
      const storageService = container.resolve<StorageService>('storageService');
      const postForPath = new Post();
      postForPath.id = postId;
      const ext = req.file.mimetype.split('/')[1] || 'jpg';
      const path = StoragePathResolver.forModel(postForPath, ext);
      const result = await storageService.upload(path, {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        filename: req.file.originalname,
        size: req.file.size,
      });
      const updated = await this.#service.update(
        postId,
        { storageDisk: result.disk, storagePath: result.path },
        req.user!.userId,
        req.user!.role
      );
      return super.ok(
        res,
        this.#postResource.make(updated),
        'Image uploaded successfully'
      );
    });
  }

  public async toggleLike(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const postId = parseIdParam(req.params.postId);
      const result = await this.#service.toggleLike(postId, req.user!.userId);
      return super.ok(
        res,
        result,
        result.liked ? 'Post liked.' : 'Like removed.'
      );
    });
  }

  public async getPostLikes(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const postId = parseIdParam(req.params.postId);
      const likes = await this.#service.getPostLikes(postId);
      return super.ok(
        res,
        {
          data: this.#likeResource.collection(likes),
        },
        'Post likes retrieved.'
      );
    });
  }
}
