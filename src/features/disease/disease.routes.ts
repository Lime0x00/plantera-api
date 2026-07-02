import { Router } from 'express';
import { container } from '#app/container';
import { DiseaseController } from '#features/disease/disease.controller';
import { validateQuery } from '#framework/middleware/validation.middleware';
import { DiseaseListQueryDto } from '#features/disease/dtos';

const diseaseRouter = Router();
const c = container.resolve<DiseaseController>('diseaseController');

diseaseRouter.get('/', validateQuery(DiseaseListQueryDto), c.list);
diseaseRouter.get('/:id', c.getById);

export { diseaseRouter };
