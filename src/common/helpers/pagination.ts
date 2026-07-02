import type { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  req: Request,
  defaults = { page: 1, limit: 20 }
): PaginationParams {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;
  const page = Math.max(
    1,
    typeof rawPage === 'number'
      ? rawPage
      : parseInt(rawPage as string) || defaults.page
  );
  const limit = Math.min(
    100,
    Math.max(
      1,
      typeof rawLimit === 'number'
        ? rawLimit
        : parseInt(rawLimit as string) || defaults.limit
    )
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function paginate(totalCount: number, page: number, limit: number) {
  return { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) };
}

export function clampLimit(limit: number, min = 1, max = 100): number {
  return Math.min(max, Math.max(min, limit));
}

export function offset(page: number, limit: number): number {
  return (page - 1) * clampLimit(limit);
}
