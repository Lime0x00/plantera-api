import { BaseModel, type CastType } from '#framework/domain/base-model';
import type { ImageStorable } from '#framework/domain/interfaces';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export class User extends BaseModel implements ImageStorable {
  static modelKey = 'user';
  static casts: Record<string, CastType> = {
    id: 'number',
    failedLoginAttempts: 'number',
    createdAt: 'date',
    updatedAt: 'date',
    deletedAt: 'date',
    lockedUntil: 'date',
  };

  email!: string;
  firstName!: string;
  lastName!: string;
  userName!: string;
  password!: string;
  timezone?: string | null;
  storageDisk?: string | null;
  storagePath?: string | null;
  pushToken?: string | null;
  pushPlatform?: string | null;
  role?: string | null;
  failedLoginAttempts!: number;
  lockedUntil?: Date | null;

  storageDir(): string {
    return 'users/avatars';
  }

  storageVirtualPath(): string {
    return `users/avatars/${this.id}`;
  }

  resolveImageUrl(): string | null {
    return this.storageDisk && this.storagePath
      ? StorageFactory.disk(this.storageDisk).url(this.storagePath)
      : null;
  }

  static resolveAvatarFrom(data: {
    storageDisk?: string | null;
    storagePath?: string | null;
  }): string | null {
    return data.storageDisk && data.storagePath
      ? StorageFactory.disk(data.storageDisk).url(data.storagePath)
      : null;
  }
}
