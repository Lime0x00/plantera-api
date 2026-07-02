import { faker } from '@faker-js/faker';

export interface CommunityPostFactoryData {
  title: string;
  content: string;
  category?: string | null;
  tags?: string | null;
  imageUrl?: string | null;
  published: boolean;
  authorId: number;
}

export function makeCommunityPost(
  authorId: number,
  data?: Partial<CommunityPostFactoryData>
): CommunityPostFactoryData {
  return {
    title: data?.title ?? faker.lorem.sentence(),
    content: data?.content ?? faker.lorem.paragraphs(2),
    category:
      data?.category ??
      faker.helpers.arrayElement(['general', 'tips', 'help', 'showcase']),
    tags: data?.tags ?? faker.lorem.words(3),
    imageUrl: data?.imageUrl ?? null,
    published: data?.published ?? true,
    authorId,
  };
}

export function makeCommunityPosts(
  authorId: number,
  count: number
): CommunityPostFactoryData[] {
  return Array.from({ length: count }, () => makeCommunityPost(authorId));
}

export interface CommunityCommentFactoryData {
  content: string;
  postId: number;
  authorId: number;
}

export function makeCommunityComment(
  postId: number,
  authorId: number,
  data?: Partial<CommunityCommentFactoryData>
): CommunityCommentFactoryData {
  return {
    content: data?.content ?? faker.lorem.sentence(),
    postId,
    authorId,
  };
}

export function makeCommunityComments(
  postId: number,
  authorIds: number[]
): CommunityCommentFactoryData[] {
  return authorIds.map((authorId) => makeCommunityComment(postId, authorId));
}
