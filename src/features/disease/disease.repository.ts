import { BaseRepository } from '#infrastructure/database/base-repository';
import { Disease } from './domain';
import type { IDiseaseRepository } from './disease.repository.interface';

interface DiseaseWhereUnique {
  id?: number;
}
interface DiseaseWhereMany {
  name?: string | { equals: string; mode: 'insensitive' };
  type?: string;
}

export class DiseaseRepository
  extends BaseRepository<
    Disease,
    DiseaseWhereUnique,
    DiseaseWhereMany,
    Record<string, unknown>,
    Record<string, unknown>
  >
  implements IDiseaseRepository
{
  constructor() {
    super(Disease);
  }

  async findById(args: { where: { id: number } }): Promise<Disease | null> {
    return super.findUnique({ where: { id: args.where.id } });
  }

  async count(args?: {
    where?: { name?: string; type?: string };
  }): Promise<number> {
    return super.count({ where: args?.where as DiseaseWhereMany });
  }
}
