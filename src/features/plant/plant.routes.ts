import { Router } from 'express';
import { container } from '#app/container';
import { PlantController } from '#features/plant/plant.controller';
import { authenticate } from '#framework/middleware/auth.middleware';
import { mlLimiter } from '#framework/middleware/rate-limiter.middleware';
import { mlUpload } from '#framework/middleware/ml-upload.middleware';
import { validateQuery } from '#framework/middleware/validation.middleware';
import { PlantListQueryDto } from '#features/plant/dtos';

const plantRouter = Router();
const c = container.resolve<PlantController>('plantController');

plantRouter.get(
  '/',
  authenticate,
  validateQuery(PlantListQueryDto),
  c.listPlants
);
plantRouter.get('/:id', authenticate, c.getPlantById);
plantRouter.post(
  '/classify',
  authenticate,
  mlLimiter,
  ...mlUpload,
  c.classifyPlant
);
plantRouter.post(
  '/diagnose',
  authenticate,
  mlLimiter,
  ...mlUpload,
  c.diagnosePlant
);

export { plantRouter };
