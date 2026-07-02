import { NotFoundError } from '#common/errors';

export function parseIdParam(value: string | string[] | undefined): number {
  const str = typeof value === 'string' ? value : value?.[0];
  const id = parseInt(str ?? '', 10);
  if (isNaN(id) || id < 1 || id > 2147483647) {
    throw new NotFoundError('Resource not found');
  }
  return id;
}
