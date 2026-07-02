import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import { parseIdParam } from '#common/helpers';

import { PlantService } from '#features/plant/plant.service';
import { PlantResource } from '#features/plant/resources';
import { PlantListQueryDto } from '#features/plant/dtos';

interface PlantControllerDeps {
  services: { plantService: PlantService };
}

export class PlantController extends Controller {
  #plantService: PlantService;
  #resource = new PlantResource();

  constructor({ services: { plantService } }: PlantControllerDeps) {
    super();
    this.#plantService = plantService;
  }

  public async listPlants(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const filters = req.validatedQuery as PlantListQueryDto;
      const result = await this.#plantService.listPlants(filters);

      return super.ok(
        res,
        { data: this.#resource.collection(result.data), meta: result.meta },
        'Plants retrieved successfully'
      );
    });
  }

  public async getPlantById(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const id = parseIdParam(req.params.id);

      const { plant } = await this.#plantService.getPlantById(id);

      return super.ok(
        res,
        this.#resource.make(plant),
        'Plant details retrieved successfully'
      );
    });
  }

  public async classifyPlant(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const result = req.file
        ? await this.#plantService.classifyPlant(
            req.user!.userId,
            req.file.buffer,
            req.file.mimetype
          )
        : await this.#plantService.classifyPlant(
            req.user!.userId,
            undefined,
            undefined,
            req.body.imageUrl
          );

      return super.ok(res, result, 'Plant image submitted for classification');
    });
  }

  public async diagnosePlant(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const result = req.file
        ? await this.#plantService.diagnosePlant(
            req.user!.userId,
            req.file.buffer,
            req.file.mimetype
          )
        : await this.#plantService.diagnosePlant(
            req.user!.userId,
            undefined,
            undefined,
            req.body.imageUrl
          );

      return super.ok(res, result, 'Plant image submitted for diagnosis');
    });
  }
}
