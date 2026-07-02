import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import { parseIdParam } from '#common/helpers';

import { DiseaseService } from '#features/disease/disease.service';
import { DiseaseResource } from '#features/disease/resources';
import { DiseaseListQueryDto } from '#features/disease/dtos';

interface DiseaseControllerDeps {
  services: { diseaseService: DiseaseService };
}

export class DiseaseController extends Controller {
  #service: DiseaseService;
  #resource = new DiseaseResource();

  constructor({ services: { diseaseService } }: DiseaseControllerDeps) {
    super();
    this.#service = diseaseService;
  }

  public async list(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { type, page, limit } = req.validatedQuery as DiseaseListQueryDto;
      const result = await this.#service.list(page ?? 1, limit ?? 20, type);

      return super.ok(
        res,
        { data: this.#resource.collection(result.data), meta: result.meta },
        'Diseases retrieved successfully'
      );
    });
  }

  public async getById(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const id = parseIdParam(req.params.id);

      const { disease } = await this.#service.getById(id);

      return super.ok(
        res,
        this.#resource.make(disease),
        'Disease retrieved successfully'
      );
    });
  }
}
