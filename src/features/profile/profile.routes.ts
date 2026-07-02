import { Router } from 'express';
import { container } from '#app/container';
import { ProfileController } from '#features/profile/profile.controller';
import { authenticate } from '#framework/middleware/auth.middleware';
import { validateDto } from '#framework/middleware/validation.middleware';
import { upload } from '#framework/middleware/upload.middleware';
import {
  UpdateProfileRequestDto,
  ChangePasswordRequestDto,
  UpdateNotificationPreferencesRequestDto,
  SavePushTokenDto,
  SendEmailOtpDto,
} from '#features/user/dtos';

const profileRouter = Router();
const c = container.resolve<ProfileController>('profileController');

profileRouter.get('/', authenticate, c.getProfile);
profileRouter.patch(
  '/',
  authenticate,
  validateDto(UpdateProfileRequestDto),
  c.updateProfile
);
profileRouter.patch(
  '/password',
  authenticate,
  validateDto(ChangePasswordRequestDto),
  c.changePassword
);
profileRouter.patch(
  '/avatar',
  authenticate,
  upload.single('image'),
  c.updateAvatar
);
profileRouter.get('/notifications', authenticate, c.getNotificationPreferences);
profileRouter.patch(
  '/notifications',
  authenticate,
  validateDto(UpdateNotificationPreferencesRequestDto),
  c.updateNotificationPreferences
);
profileRouter.post(
  '/push-token',
  authenticate,
  validateDto(SavePushTokenDto),
  c.savePushToken
);
profileRouter.delete('/push-token', authenticate, c.removePushToken);
profileRouter.post(
  '/email/send-otp',
  authenticate,
  validateDto(SendEmailOtpDto),
  c.sendEmailOtp
);

export { profileRouter };
