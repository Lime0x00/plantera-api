import bcrypt from 'bcrypt';

import { BadRequestError, NotFoundError, ConflictError } from '#common/errors';
import { fieldErrors } from '#common/errors/details';

import type {
  UpdateProfileRequestDto,
  ChangePasswordRequestDto,
  UpdateNotificationPreferencesRequestDto,
  SavePushTokenDto,
} from '#features/user/dtos';
import { UserErrors } from '#features/user/user.errors';
import { UserService } from '#features/user/user.service';
import { StorageService } from '#infrastructure/storage/storage.service';
import { StoragePathResolver } from '#infrastructure/storage/storage-path.resolver';
import { User } from '#features/user/domain/user.model';
import type { IMyPlantRepository } from '#features/myPlant/myPlant.repository.interface';
import type { ICareLogRepository } from '#features/myPlant/careLog.repository.interface';
import { OtpService } from '#features/auth/otp.service';

interface ProfileServiceDeps {
  userService: UserService;
  storageService: StorageService;
  myPlantRepository: IMyPlantRepository;
  careLogRepository: ICareLogRepository;
  otpService: OtpService;
}

export class ProfileService {
  #userService: UserService;
  #storage: StorageService;
  #myPlantRepository: IMyPlantRepository;
  #careLogRepository: ICareLogRepository;
  #otpService: OtpService;

  constructor({
    userService,
    storageService,
    myPlantRepository,
    careLogRepository,
    otpService,
  }: ProfileServiceDeps) {
    this.#userService = userService;
    this.#storage = storageService;
    this.#myPlantRepository = myPlantRepository;
    this.#careLogRepository = careLogRepository;
    this.#otpService = otpService;
  }

  public async getProfile(userId: number) {
    const user = await this.#userService.findById(userId);
    if (!user) {
      throw new NotFoundError(UserErrors.USER_NOT_FOUND);
    }

    const [plantsCount, wateringCount, fertilizingCount] = await Promise.all([
      this.#myPlantRepository.count({ where: { userId } }),
      this.#careLogRepository.count({ where: { userId, type: 'watering' } }),
      this.#careLogRepository.count({ where: { userId, type: 'fertilizing' } }),
    ]);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      avatarUrl: user.resolveImageUrl(),
      plantsCount,
      wateringCount,
      fertilizingCount,
    };
  }

  public async updateProfile(userId: number, dto: UpdateProfileRequestDto) {
    const user = await this.#userService.findById(userId);
    if (!user) {
      throw new NotFoundError(UserErrors.USER_NOT_FOUND);
    }

    return this.#userService.update(userId, dto);
  }

  public async changePassword(userId: number, dto: ChangePasswordRequestDto) {
    const user = await this.#userService.findById(userId);
    if (!user) {
      throw new NotFoundError(UserErrors.USER_NOT_FOUND);
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestError(
        UserErrors.PASSWORD_FAILED,
        fieldErrors<keyof ChangePasswordRequestDto>({
          currentPassword: {
            code: 'INCORRECT',
            message: UserErrors.PASSWORD_INCORRECT,
          },
        })
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.#userService.updatePassword(userId, hashedPassword);
  }

  public async getNotificationPreferences(userId: number) {
    return this.#userService.getNotificationPreferences(userId);
  }

  public async updateNotificationPreferences(
    userId: number,
    dto: UpdateNotificationPreferencesRequestDto
  ) {
    return this.#userService.updateNotificationPreferences(userId, dto);
  }

  public async savePushToken(userId: number, dto: SavePushTokenDto) {
    return this.#userService.savePushToken(userId, dto);
  }

  public async removePushToken(userId: number) {
    return this.#userService.removePushToken(userId);
  }

  public async updateAvatar(
    userId: number,
    imageBuffer: Buffer,
    mimeType: string
  ) {
    const user = new User();
    user.id = userId;
    const ext = mimeType.split('/')[1] || 'jpg';
    const stored = await this.#storage.upload(
      StoragePathResolver.forModel(user, ext),
      {
        filename: `avatar.${ext}`,
        buffer: imageBuffer,
        mimeType,
        size: imageBuffer.length,
      }
    );
    return this.#userService.update(userId, {
      storageDisk: stored.disk,
      storagePath: stored.path,
    });
  }

  public async sendEmailOtp(userId: number, newEmail: string) {
    const existingUser = await this.#userService.findByEmail(newEmail);
    if (existingUser) {
      throw new ConflictError(
        'Email address is already in use by another account.',
        {
          email: {
            code: 'CONFLICT',
            message: 'Email address is already in use by another account.',
          },
        }
      );
    }

    await this.#otpService.generate(newEmail, 'email_verify' as any);
  }
}
