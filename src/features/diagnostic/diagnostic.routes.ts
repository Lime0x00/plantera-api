import { Router } from 'express';
import { container } from '#app/container';
import { DiagnosticController } from '#features/diagnostic/diagnostic.controller';
import { authenticate } from '#framework/middleware/auth.middleware';
import { mlUpload } from '#framework/middleware/ml-upload.middleware';
import { validateQuery } from '#framework/middleware/validation.middleware';
import { DiagnosticListQueryDto } from '#features/diagnostic/dtos';

const diagnosticRouter = Router();
const c = container.resolve<DiagnosticController>('diagnosticController');

diagnosticRouter.use(authenticate);

diagnosticRouter.post('/', ...mlUpload, c.diagnose);
diagnosticRouter.get('/', validateQuery(DiagnosticListQueryDto), c.listRecords);
diagnosticRouter.get('/:id', c.getRecord);

export { diagnosticRouter };
