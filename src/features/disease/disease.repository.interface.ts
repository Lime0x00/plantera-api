import type { Disease } from './domain';
import type { FindUniqueArgs, FindManyArgs } from '#common/types';

export interface IDiseaseRepository {
  findMany(
    args?: FindManyArgs<{ name?: string; type?: string }>
  ): Promise<Disease[]>;
  findById(args: FindUniqueArgs<{ id: number }>): Promise<Disease | null>;
  count(args?: { where?: { name?: string; type?: string } }): Promise<number>;
}
