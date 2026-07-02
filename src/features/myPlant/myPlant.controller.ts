import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import type { TypedRequestBody } from '#common/types';
import { parsePagination, parseIdParam } from '#common/helpers';

import { MyPlantResource } from '#features/myPlant/resources';
import { MyPlantService } from '#features/myPlant/myPlant.service';
import { CalendarCareQueryDto } from '#features/myPlant/dtos';
import type {
  AddToMyPlantsRequest,
} from '#features/myPlant/myPlant.types';

interface MyPlantControllerDeps {
  services: { myPlantService: MyPlantService };
}

export class MyPlantController extends Controller {
  #myPlantService: MyPlantService;
  #resource = new MyPlantResource();

  constructor({ services: { myPlantService } }: MyPlantControllerDeps) {
    super();
    this.#myPlantService = myPlantService;
  }

  public async listMyPlants(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { page, limit } = parsePagination(req);

      const result = await this.#myPlantService.listMyPlants(
        req.user!.userId,
        page,
        limit
      );

      return super.ok(
        res,
        {
          data: this.#resource.collection(result.data),
          meta: result.meta,
        },
        'My plants retrieved successfully'
      );
    });
  }

  public async addToMyPlants(
    req: TypedRequestBody<AddToMyPlantsRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const { myPlant } = await this.#myPlantService.addToMyPlants(
        req.user!.userId,
        req.body.plantId
      );

      return super.created(
        res,
        { myPlant: this.#resource.make(myPlant) },
        'Plant added to your collection'
      );
    });
  }

  public async removeFromMyPlants(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#myPlantService.removeFromMyPlants(
        req.user!.userId,
        parseIdParam(req.params.plantId)
      );

      return super.ok(res, {}, 'Plant removed from your collection');
    });
  }


  public async waterPlant(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { myPlant } = await this.#myPlantService.water(
        req.user!.userId,
        parseIdParam(req.params.plantId)
      );

      return super.ok(
        res,
        { myPlant: this.#resource.make(myPlant) },
        'Plant watered successfully'
      );
    });
  }

  public async fertilizePlant(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { myPlant } = await this.#myPlantService.fertilize(
        req.user!.userId,
        parseIdParam(req.params.plantId)
      );

      return super.ok(
        res,
        { myPlant: this.#resource.make(myPlant) },
        'Plant fertilized successfully'
      );
    });
  }

  public async upcomingCare(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { data } = await this.#myPlantService.upcomingCare(
        req.user!.userId
      );

      return super.ok(
        res,
        this.#resource.collection(data),
        'Upcoming care tasks retrieved'
      );
    });
  }

  public async calendarCare(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const _query = req.validatedQuery as unknown as CalendarCareQueryDto;
      const { data } = await this.#myPlantService.calendarCare(
        req.user!.userId
      );

      return super.ok(
        res,
        this.#resource.collection(data),
        'Care calendar retrieved successfully'
      );
    });
  }

  public async careEvents(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { data } = await this.#myPlantService.careEvents(req.user!.userId);

      return super.ok(res, data, 'Care events retrieved successfully.');
    });
  }

  public async identifyPlant(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const result = req.file
        ? await this.#myPlantService.identifyPlant(
            req.user!.userId,
            req.file.buffer,
            req.file.mimetype
          )
        : await this.#myPlantService.identifyPlant(
            req.user!.userId,
            undefined,
            undefined,
            req.body.imageUrl
          );

      if (result.status === 'identified') {
        return super.created(
          res,
          {
            myPlant: this.#resource.make(result.myPlant!),
            recordId: result.recordId,
          },
          'Plant identified and added to your collection.'
        );
      }

      return super.ok(res, result, 'Plant identification started');
    });
  }

  public async confirmIdentify(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const { recordId, predictionIndex } = req.body;
      const { myPlant, prediction } =
        await this.#myPlantService.confirmIdentify(
          req.user!.userId,
          recordId,
          predictionIndex
        );

      return super.created(
        res,
        { myPlant: this.#resource.make(myPlant), prediction },
        'Plant identification confirmed'
      );
    });
  }

  public async diagnoseMyPlant(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const myPlantId = parseIdParam(req.params.plantId);
      const result = req.file
        ? await this.#myPlantService.diagnoseMyPlant(
            req.user!.userId,
            myPlantId,
            req.file.buffer,
            req.file.mimetype
          )
        : await this.#myPlantService.diagnoseMyPlant(
            req.user!.userId,
            myPlantId,
            undefined,
            undefined,
            req.body.imageUrl
          );

      return super.ok(res, result, 'Plant diagnosis completed');
    });
  }

  public async getDiagnoses(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const myPlantId = parseIdParam(req.params.plantId);
      const { page, limit } = parsePagination(req);
      const { records, ...meta } = await this.#myPlantService.getDiagnoses(
        req.user!.userId,
        myPlantId,
        page,
        limit
      );

      return super.ok(
        res,
        { data: records, meta },
        'Diagnosis history retrieved'
      );
    });
  }

  public async updateImage(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const myPlantId = parseIdParam(req.params.plantId);
      const { myPlant } = await this.#myPlantService.updateImage(
        req.user!.userId,
        myPlantId,
        req.file!.buffer,
        req.file!.mimetype
      );

      return super.ok(
        res,
        { myPlant: this.#resource.make(myPlant) },
        'Plant image updated'
      );
    });
  }

  public async markCareComplete(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const { myPlantId, type } = req.body;
      const { myPlant } = await this.#myPlantService.markCareComplete(
        req.user!.userId,
        myPlantId,
        type
      );

      return super.ok(
        res,
        { myPlant: this.#resource.make(myPlant) },
        'Care task marked as complete.'
      );
    });
  }

  public async getCareLogs(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { page, limit } = parsePagination(req);
      const myPlantId = req.query.myPlantId
        ? Number(req.query.myPlantId)
        : undefined;
      const result = await this.#myPlantService.getCareLogs(
        req.user!.userId,
        myPlantId,
        page,
        limit
      );

      return super.ok(res, result, 'Care logs retrieved successfully');
    });
  }
}
