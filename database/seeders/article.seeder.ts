import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '#common/types/generated/prisma';
import { Logger } from '#infrastructure/observability/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ArticleSeed {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  imageUrl: string;
  published: boolean;
}

export async function seedArticles(
  prisma: PrismaClient,
  options: { articles?: number; authorId?: number } = {}
): Promise<number[]> {
  const allArticles: ArticleSeed[] = JSON.parse(
    require('fs').readFileSync(
      path.join(__dirname, '..', 'data', 'articles.json'),
      'utf-8'
    )
  );

  const toArticle = allArticles.slice(0, options.articles ?? allArticles.length);
  const authorId = options.authorId ?? 1;

  const articleIds: number[] = [];
  for (const a of toArticle) {
    const existing = await prisma.article.findFirst({
      where: { title: a.title },
    });

    if (existing) {
      articleIds.push(existing.id);
      continue;
    }

    const { id } = await prisma.article.create({
      data: {
        title: a.title,
        content: a.content,
        excerpt: a.excerpt,
        category: a.category,
        storageDisk: 'url',
        storagePath: a.imageUrl,
        published: a.published,
        authorId,
      } as any,
    });
    articleIds.push(id);
  }

  Logger.info(`  → ${articleIds.length} articles`);
  return articleIds;
}