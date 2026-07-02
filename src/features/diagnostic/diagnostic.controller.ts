import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import { parsePagination, parseIdParam } from '#common/helpers';

import { DiagnosticService } from '#features/diagnostic/diagnostic.service';
import { DiagnosticRecordResource } from '#features/diagnostic/resources';
import { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';

interface DiagnosticControllerDeps {
  services: { diagnosticService: DiagnosticService };
}

export class DiagnosticController extends Controller {
  #service: DiagnosticService;
  #resource = new DiagnosticRecordResource();

  constructor({ services: { diagnosticService } }: DiagnosticControllerDeps) {
    super();
    this.#service = diagnosticService;
  }

  public async diagnose(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const result = req.file
        ? await this.#service.diagnose(
            req.user!.userId,
            req.file.buffer,
            req.file.mimetype
          )
        : await this.#service.diagnose(
            req.user!.userId,
            undefined,
            undefined,
            req.body.imageUrl
          );

      return super.ok(res, result, 'Image analyzed successfully');
    });
  }

  public async getRecord(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const recordId = parseIdParam(req.params.id);

      const result = await this.#service.getRecord(req.user!.userId, recordId);

      return super.ok(
        res,
        this.#resource.make(result),
        result.status === DiagnosticStatus.COMPLETED
          ? 'Analysis complete.'
          : 'Analysis in progress.'
      );
    });
  }

  public async listRecords(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const { page, limit } = parsePagination(req);

      const { records, totalCount, totalPages, ...rest } =
        await this.#service.listRecords(req.user!.userId, page, limit);

      return super.ok(
        res,
        {
          data: this.#resource.collection(records),
          meta: { page: rest.page, limit: rest.limit, totalCount, totalPages },
        },
        'Diagnostic records retrieved successfully'
      );
    });
  }
}
