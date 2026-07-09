import { NotFoundError, ForbiddenError } from '#common/errors';
import type {
  IPostRepository,
  PostCreateInput,
  PostUpdateInput,
} from './community.repository.interface';
import type { ICommentRepository } from './comment.repository.interface';
import type { ILikeRepository } from './like.repository.interface';
import { LikeModel } from './domain/like.model';
import { PostPolicy } from './community.policy';
import { COMMUNITY_ERRORS } from './community.messages';

const POST_INCLUDE = {
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
  _count: { select: { comments: true, likes: true } },
} as const;

interface CommunityServiceDeps {
  policies: { postPolicy: PostPolicy };
  repositories: {
    communityRepository: IPostRepository;
    commentRepository: ICommentRepository;
    likeRepository: ILikeRepository;
  };
  notificationService?: {
    create: (dto: {
      userId: number;
      type: string;
      title: string;
      body: string;
      plantId?: number | null;
    }) => Promise<unknown>;
  };
}

export class CommunityService {
  #repository: IPostRepository;
  #commentRepository: ICommentRepository;
  #likeRepository: ILikeRepository;
  #policy: PostPolicy;
  #notificationService: CommunityServiceDeps['notificationService'];

  constructor({
    policies: { postPolicy },
    repositories: { communityRepository, commentRepository, likeRepository },
  }: CommunityServiceDeps) {
    this.#policy = postPolicy;
    this.#repository = communityRepository;
    this.#commentRepository = commentRepository;
    this.#likeRepository = likeRepository;
  }

  setNotificationService(
    service: NonNullable<CommunityServiceDeps['notificationService']>
  ): void {
    this.#notificationService = service;
  }

  async create(dto: PostCreateInput, userId: number, userRole: string) {
    if (!this.#policy.canCreate({ id: userId, role: userRole })) {
      throw new ForbiddenError(COMMUNITY_ERRORS.FORBIDDEN);
    }
    return this.#repository.create({ data: dto, include: POST_INCLUDE });
  }

  async findById(id: number) {
    const entity = await this.#repository.findUnique({
      where: { id },
      include: POST_INCLUDE,
    });
    if (!entity) {
      throw new NotFoundError(COMMUNITY_ERRORS.NOT_FOUND);
    }
    return entity;
  }

  async findAllPublished(
    cursor?: number,
    limit: number = 20,
    viewerId?: number
  ) {
    const repository = this.#repository.withoutTrashed();
    const where = cursor
      ? { published: true, id: { lt: cursor } }
      : { published: true };

    const data = await repository.findMany({
      where,
      take: limit + 1,
      orderBy: { id: 'desc' },
      include: POST_INCLUDE,
    });

    const hasMore = data.length > limit;
    const posts = hasMore ? data.slice(0, limit) : data;

    if (viewerId) {
      const postIds = posts.map((p) => p.id);
      const likes = await this.#likeRepository.findMany({
        where: { postId: { in: postIds }, authorId: viewerId },
      });
      const likedSet = new Set(likes.map((l) => l.postId));
      for (const post of posts) {
        (post as any).liked = likedSet.has(post.id);
      }
    }

    const nextCursor = hasMore ? posts[posts.length - 1].id : undefined;

    return {
      data: posts,
      meta: {
        nextCursor,
        hasMore,
      },
    };
  }

  async update(
    id: number,
    dto: PostUpdateInput,
    userId: number,
    userRole: string
  ) {
    const entity = await this.findById(id);
    if (
      !this.#policy.canUpdate({ id: userId, role: userRole }, entity.authorId)
    ) {
      throw new ForbiddenError(COMMUNITY_ERRORS.FORBIDDEN);
    }
    return this.#repository.update({
      where: { id },
      data: dto,
      include: POST_INCLUDE,
    });
  }

  async delete(id: number, userId: number, userRole: string) {
    const entity = await this.findById(id);
    if (
      !this.#policy.canDelete({ id: userId, role: userRole }, entity.authorId)
    ) {
      throw new ForbiddenError(COMMUNITY_ERRORS.FORBIDDEN);
    }
    return this.#repository.delete({ where: { id } });
  }

  async createComment(
    postId: number,
    dto: { content: string; authorId: number }
  ) {
    const post = await this.#repository.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundError(COMMUNITY_ERRORS.NOT_FOUND);
    }
    const comment = await this.#commentRepository.create({
      data: { content: dto.content, postId, authorId: dto.authorId },
      include: {
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
      },
    });

    if (this.#notificationService && post.authorId !== dto.authorId) {
      const commentAuthor = (comment as any).author as
        | { userName?: string }
        | undefined;
      this.#notificationService
        .create({
          userId: post.authorId,
          type: 'comment',
          title: 'New Comment',
          body: `${commentAuthor?.userName ?? 'Someone'} commented on your post`,
        })
        .catch(() => {});
    }

    return comment;
  }

  async listComments(postId: number, cursor?: number, limit: number = 20) {
    const where = cursor ? { postId, id: { lt: cursor } } : { postId };

    const data = await this.#commentRepository.findMany({
      where,
      take: limit + 1,
      orderBy: { id: 'desc' },
      include: {
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
      },
    });

    const hasMore = data.length > limit;
    const comments = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? comments[comments.length - 1].id : undefined;

    return {
      data: comments,
      meta: { nextCursor, hasMore },
    };
  }

  async deleteComment(commentId: number, userId: number, userRole: string) {
    const comment = await this.#commentRepository.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundError(COMMUNITY_ERRORS.NOT_FOUND);
    }
    if (
      !this.#policy.canDelete({ id: userId, role: userRole }, comment.authorId)
    ) {
      throw new ForbiddenError(COMMUNITY_ERRORS.FORBIDDEN);
    }
    return this.#commentRepository.delete({ where: { id: commentId } });
  }

  async toggleLike(postId: number, userId: number) {
    const post = await this.#repository.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundError(COMMUNITY_ERRORS.NOT_FOUND);
    }
    const existing = await this.#likeRepository.findByPostAndAuthor(
      postId,
      userId
    );
    if (existing) {
      await this.#likeRepository.deleteByPostAndAuthor(postId, userId);
      const likesCount = await this.#likeRepository.count({ where: { postId } });
      return { liked: false, likesCount };
    }

    const softDeleted = await this.#likeRepository.findDeletedByPostAndAuthor(
      postId,
      userId
    );
    if (softDeleted) {
      await this.#likeRepository.restoreByPostAndAuthor(postId, userId);

      if (this.#notificationService && post.authorId !== userId) {
        this.#notificationService
          .create({
            userId: post.authorId,
            type: 'like',
            title: 'New Like',
            body: 'Someone liked your post',
          })
          .catch(() => {});
      }

      const likesCount = await this.#likeRepository.count({ where: { postId } });
      return { liked: true, likesCount };
    }

    await this.#likeRepository.create({ data: { postId, authorId: userId } });

    if (this.#notificationService && post.authorId !== userId) {
      this.#notificationService
        .create({
          userId: post.authorId,
          type: 'like',
          title: 'New Like',
          body: 'Someone liked your post',
        })
        .catch(() => {});
    }

    const likesCount = await this.#likeRepository.count({ where: { postId } });
    return { liked: true, likesCount };
  }

  async getPostLikes(postId: number) {
    const post = await this.#repository.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundError(COMMUNITY_ERRORS.NOT_FOUND);
    }

    type LikeWithAuthor = LikeModel & {
      author: {
        id: number;
        userName: string;
        firstName: string;
        lastName: string;
        storageDisk: string | null;
        storagePath: string | null;
      };
    };

    const likes = await this.#likeRepository.findMany({
      where: { postId },
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return likes as LikeWithAuthor[];
  }
}
