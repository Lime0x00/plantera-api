import bcrypt from 'bcrypt';

import { ConflictError, NotFoundError } from '#common/errors';
import { fieldErrors } from '#common/errors/details';
import { config } from '#common/helpers';

import type {
  SavePushTokenDto,
  UpdateNotificationPreferencesRequestDto,
} from '#features/user/dtos';
import { UserErrors } from './user.errors';
import type {
  IUserRepository,
  UserUpdateInput,
} from './user.repository.interface';
import type {
  INotificationPreferencesRepository,
  NotificationPreferencesUpdateInput,
} from './notificationPreferences.repository.interface';

interface UserServiceDeps {
  repositories: {
    userRepository: IUserRepository;
    notificationPreferencesRepository: INotificationPreferencesRepository;
  };
}

export class UserService {
  #repository: IUserRepository;
  #notifPrefsRepository: INotificationPreferencesRepository;

  constructor({
    repositories: { userRepository, notificationPreferencesRepository },
  }: UserServiceDeps) {
    this.#repository = userRepository;
    this.#notifPrefsRepository = notificationPreferencesRepository;
  }

  public async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    userName: string;
    password: string;
  }) {
    const existingEmail = await this.#repository.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new ConflictError(
        UserErrors.EMAIL_TAKEN,
        fieldErrors({
          email: { code: 'CONFLICT', message: UserErrors.EMAIL_TAKEN },
        })
      );
    }

    const existingUserName = await this.#repository.findUnique({
      where: { userName: data.userName },
    });
    if (existingUserName) {
      throw new ConflictError(
        'Username is already taken.',
        fieldErrors({
          userName: { code: 'CONFLICT', message: 'Username is already taken.' },
        })
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.#repository.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  public async findById(id: number) {
    return this.#repository.findUnique({ where: { id } });
  }

  public async findByEmail(email: string) {
    return this.#repository.findUnique({ where: { email } });
  }

  public async update(userId: number, data: UserUpdateInput) {
    return this.#repository.update({ where: { id: userId }, data });
  }

  public async savePushToken(userId: number, dto: SavePushTokenDto) {
    const user = await this.#repository.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError(UserErrors.USER_NOT_FOUND);
    }
    return this.#repository.update({
      where: { id: userId },
      data: { pushToken: dto.token, pushPlatform: dto.platform ?? 'expo' },
    });
  }

  public async removePushToken(userId: number) {
    const user = await this.#repository.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError(UserErrors.USER_NOT_FOUND);
    }
    return this.#repository.update({
      where: { id: userId },
      data: { pushToken: null, pushPlatform: null },
    });
  }

  public async updateFailedLoginAttempts(userId: number, attempts: number) {
    const maxAttempts = config<number>('auth.maxLoginAttempts', 5);
    const data: UserUpdateInput = { failedLoginAttempts: attempts };
    if (attempts >= maxAttempts) {
      const lockoutMinutes = config<number>('auth.lockoutMinutes', 15);
      data.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      return this.#repository.update({ where: { id: userId }, data });
    }
    return this.#repository.updateSilent({ where: { id: userId }, data });
  }

  public async resetLoginAttempts(userId: number) {
    return this.#repository.updateSilent({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  public async updatePassword(userId: number, hashedPassword: string) {
    return this.#repository.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  public async getNotificationPreferences(userId: number) {
    let prefs = await this.#notifPrefsRepository.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.#notifPrefsRepository.create({
        data: { userId },
      });
    }
    return prefs;
  }

  public async updateNotificationPreferences(
    userId: number,
    dto: UpdateNotificationPreferencesRequestDto
  ) {
    const prefs = await this.#notifPrefsRepository.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return this.#notifPrefsRepository.create({
        data: {
          userId,
          pushEnabled: dto.pushEnabled ?? false,
          wateringReminders: dto.wateringReminders ?? true,
          fertilizingReminders: dto.fertilizingReminders ?? false,
          emailNotifications: dto.emailNotifications ?? true,
        },
      });
    }

    const data: NotificationPreferencesUpdateInput = {};
    if (dto.pushEnabled !== undefined) {
      data.pushEnabled = dto.pushEnabled;
    }
    if (dto.wateringReminders !== undefined) {
      data.wateringReminders = dto.wateringReminders;
    }
    if (dto.fertilizingReminders !== undefined) {
      data.fertilizingReminders = dto.fertilizingReminders;
    }
    if (dto.emailNotifications !== undefined) {
      data.emailNotifications = dto.emailNotifications;
    }

    return this.#notifPrefsRepository.update({
      where: { id: prefs.id! },
      data,
    });
  }
}
