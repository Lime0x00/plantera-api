import { BaseModel } from '#framework/domain/base-model';
import type { ImageStorable } from '#framework/domain/interfaces';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export class Post extends BaseModel implements ImageStorable {
  static modelKey = 'post';

  id!: number;
  title!: string;
  content!: string;
  category?: string | null;
  tags?: string | null;
  storageDisk?: string | null;
  storagePath?: string | null;
  published!: boolean;
  authorId!: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  storageDir(): string {
    return 'posts';
  }

  storageVirtualPath(): string {
    return `${this.storageDir()}/${this.id}`;
  }

  resolveImageUrl(): string | null {
    return this.storageDisk && this.storagePath
      ? StorageFactory.disk(this.storageDisk).url(this.storagePath)
      : null;
  }
}
