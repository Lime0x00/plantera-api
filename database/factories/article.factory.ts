import { faker } from '@faker-js/faker';

export interface ArticleFactoryData {
  title: string;
  content: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  published: boolean;
  authorId: number;
}

export function makeArticle(
  authorId: number,
  data?: Partial<ArticleFactoryData>
): ArticleFactoryData {
  return {
    title: data?.title ?? faker.lorem.sentence(),
    content: data?.content ?? faker.lorem.paragraphs(3),
    excerpt: data?.excerpt ?? faker.lorem.sentence(),
    imageUrl: data?.imageUrl ?? null,
    published: data?.published ?? faker.datatype.boolean(0.8),
    authorId,
  };
}

export function makeArticles(
  authorId: number,
  count: number
): ArticleFactoryData[] {
  return Array.from({ length: count }, () => makeArticle(authorId));
}
