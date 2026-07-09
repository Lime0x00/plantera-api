import { NotFoundError } from '#common/errors';
import { DiseaseErrors } from './disease.errors';
import type { IDiseaseRepository } from './disease.repository.interface';
import { paginate, clampLimit, offset } from '#common/helpers';
import { Disease } from './domain';

interface DiseaseServiceDeps {
  repositories: { diseaseRepository: IDiseaseRepository };
}

export class DiseaseService {
  #repository: IDiseaseRepository;

  constructor({ repositories: { diseaseRepository } }: DiseaseServiceDeps) {
    this.#repository = diseaseRepository;
  }

  async list(page: number, limit: number, type?: string) {
    const take = clampLimit(limit);
    const where: { name?: string; type?: string } = {};
    if (type) where.type = type;

    const [data, totalCount] = await Promise.all([
      this.#repository.findMany({ where, skip: offset(page, take), take }),
      this.#repository.count({ where }),
    ]);

    return { data, meta: paginate(totalCount, page, take) };
  }

  async getById(id: number) {
    const disease = await this.#repository.findById({ where: { id } });
    if (!disease) {
      throw new NotFoundError(DiseaseErrors.NOT_FOUND);
    }
    return { disease };
  }

  async findByName(name: string) {
    const normalizedInput = name.toLowerCase().replace(/[_\-]/g, ' ').trim();

    const allDiseases = await this.#repository.findMany({});

    return allDiseases.filter((d) => {
      const normalizedDbName = d.name?.toLowerCase().replace(/[_\-]/g, ' ').trim() ?? '';
      if (normalizedDbName === normalizedInput) return true;

      if (d.otherNames) {
        const otherNames = Disease.extractArray(d.otherNames);
        return otherNames.some(
          (on: string) =>
            on.toLowerCase().replace(/[_\-]/g, ' ').trim() === normalizedInput
        );
      }

      return false;
    });
  }
}
