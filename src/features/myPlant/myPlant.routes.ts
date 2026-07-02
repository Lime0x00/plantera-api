import { Router } from 'express';
import { container } from '#app/container';
import { authenticate } from '#framework/middleware/auth.middleware';
import { mlUpload } from '#framework/middleware/ml-upload.middleware';
import { upload } from '#framework/middleware/upload.middleware';
import { MyPlantController } from '#features/myPlant/myPlant.controller';
import {
  validateDto,
  validateQuery,
} from '#framework/middleware/validation.middleware';
import {
  AddToMyPlantsDto,
  CalendarCareQueryDto,
  MyPlantListQueryDto,
} from '#features/myPlant/dtos';

const myPlantRouter = Router();
const c = container.resolve<MyPlantController>('myPlantController');

myPlantRouter.use(authenticate);

myPlantRouter.get('/', validateQuery(MyPlantListQueryDto), c.listMyPlants);
myPlantRouter.get('/care/upcoming', c.upcomingCare);
myPlantRouter.get('/care/events', c.careEvents);
myPlantRouter.get(
  '/care/calendar',
  validateQuery(CalendarCareQueryDto),
  c.calendarCare
);
myPlantRouter.get('/care/logs', c.getCareLogs);
myPlantRouter.post('/care/complete', c.markCareComplete);
myPlantRouter.post('/', validateDto(AddToMyPlantsDto), c.addToMyPlants);
myPlantRouter.delete('/:plantId', c.removeFromMyPlants);
myPlantRouter.post('/:plantId/water', c.waterPlant);
myPlantRouter.post('/:plantId/fertilize', c.fertilizePlant);

myPlantRouter.post('/identify', ...mlUpload, c.identifyPlant);
myPlantRouter.post('/identify/confirm', c.confirmIdentify);

myPlantRouter.post('/:plantId/diagnose', ...mlUpload, c.diagnoseMyPlant);
myPlantRouter.get('/:plantId/diagnoses', c.getDiagnoses);
myPlantRouter.patch('/:plantId/image', upload.single('image'), c.updateImage);

export { myPlantRouter };
