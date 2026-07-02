import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRouter } from '#features/auth/auth.routes';
import { plantRouter } from '#features/plant/plant.routes';
import { profileRouter } from '#features/profile/profile.routes';
import { myPlantRouter } from '#features/myPlant/myPlant.routes';
import { diagnosticRouter } from '#features/diagnostic/diagnostic.routes';
import { diseaseRouter } from '#features/disease/disease.routes';
import { notificationRouter } from '#features/notification/notification.routes';
import { articleRouter } from '#features/article/article.routes';
import { communityRouter } from '#features/community/community.routes';
import { uploadRouter } from '#features/upload/upload.routes';
import {
  discoverRoutes,
  methodNotAllowedHandler,
} from '#framework/middleware/method-not-allowed.middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapiSpecPath = path.resolve(__dirname, '../openapi/v1.json');

const apiV1Router: Router = Router();

const docsPath = path.resolve(__dirname, '../../public/docs/index.html');

if (process.env.NODE_ENV !== 'production') {
  apiV1Router.get('/openapi.json', (_req, res) =>
    res.sendFile(openapiSpecPath)
  );
  apiV1Router.get('/docs', (_req, res) => res.sendFile(docsPath));
}

apiV1Router.use('/auth', authRouter);
apiV1Router.use('/plants', plantRouter);
apiV1Router.use('/profile', profileRouter);
apiV1Router.use('/my-plants', myPlantRouter);
apiV1Router.use('/diagnostics', diagnosticRouter);
apiV1Router.use('/diseases', diseaseRouter);
apiV1Router.use('/notifications', notificationRouter);
apiV1Router.use('/articles', articleRouter);
apiV1Router.use('/posts', communityRouter);
apiV1Router.use('/upload', uploadRouter);

discoverRoutes('/api/v1', apiV1Router);

apiV1Router.use(methodNotAllowedHandler);

export { apiV1Router };
