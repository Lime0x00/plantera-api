import type { NextFunction, Response, Request } from 'express';

import { Controller } from '#framework/presentation/controller';
import type { TypedRequestBody } from '#common/types';

import { UserResource } from '#features/user/resources';
import { NotificationPreferencesResource } from '#features/notification/resources';
import { SavePushTokenDto, SendEmailOtpDto } from '#features/user/dtos';
import { ProfileService } from './profile.service';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateNotificationPreferencesRequest,
} from './profile.types';

interface ProfileControllerDeps {
  services: { profileService: ProfileService };
}

export class ProfileController extends Controller {
  #profileService: ProfileService;
  #userResource = new UserResource();
  #prefsResource = new NotificationPreferencesResource();

  constructor({ services: { profileService } }: ProfileControllerDeps) {
    super();
    this.#profileService = profileService;
  }

  public async getProfile(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const result = await this.#profileService.getProfile(req.user!.userId);
      return super.ok(res, { user: result }, 'Profile retrieved successfully');
    });
  }

  public async updateProfile(
    req: TypedRequestBody<UpdateProfileRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const result = await this.#profileService.updateProfile(
        req.user!.userId,
        req.body
      );
      return super.ok(
        res,
        { user: this.#userResource.make(result) },
        'Profile updated successfully'
      );
    });
  }

  public async changePassword(
    req: TypedRequestBody<ChangePasswordRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#profileService.changePassword(req.user!.userId, req.body);
      return super.ok(res, {}, 'Password changed successfully');
    });
  }

  public async getNotificationPreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const result = await this.#profileService.getNotificationPreferences(
        req.user!.userId
      );
      return super.ok(
        res,
        { preferences: this.#prefsResource.make(result) },
        'Notification preferences retrieved'
      );
    });
  }

  public async updateNotificationPreferences(
    req: TypedRequestBody<UpdateNotificationPreferencesRequest>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      const result = await this.#profileService.updateNotificationPreferences(
        req.user!.userId,
        req.body
      );
      return super.ok(
        res,
        { preferences: this.#prefsResource.make(result) },
        'Notification preferences updated'
      );
    });
  }

  public async savePushToken(
    req: TypedRequestBody<SavePushTokenDto>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#profileService.savePushToken(req.user!.userId, req.body);
      return super.ok(res, {}, 'Push token saved');
    });
  }

  public async removePushToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#profileService.removePushToken(req.user!.userId);
      return super.ok(res, {}, 'Push token removed');
    });
  }

  public async updateAvatar(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const result = await this.#profileService.updateAvatar(
        req.user!.userId,
        req.file!.buffer,
        req.file!.mimetype
      );
      return super.ok(
        res,
        { user: this.#userResource.make(result) },
        'Avatar updated successfully'
      );
    });
  }

  public async sendEmailOtp(
    req: TypedRequestBody<SendEmailOtpDto>,
    res: Response,
    next: NextFunction
  ) {
    return super.run(next, async () => {
      await this.#profileService.sendEmailOtp(
        req.user!.userId,
        req.body.newEmail
      );
      return super.ok(
        res,
        {},
        'Verification code sent to your new email address.'
      );
    });
  }
}
