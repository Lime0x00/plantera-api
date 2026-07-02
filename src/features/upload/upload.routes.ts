import { Router } from 'express';
import { container } from '#app/container';
import { UploadController } from '#features/upload/upload.controller';
import { authenticate } from '#framework/middleware/auth.middleware';
import { upload } from '#framework/middleware/upload.middleware';

const uploadRouter = Router();
const c = container.resolve<UploadController>('uploadController');

uploadRouter.post(
  '/avatar',
  authenticate,
  upload.single('image'),
  c.uploadAvatar
);

export { uploadRouter };
