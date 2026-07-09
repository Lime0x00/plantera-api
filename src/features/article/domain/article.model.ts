import { BaseModel } from '#framework/domain/base-model';
import type { ImageStorable } from '#framework/domain/interfaces';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export class Article extends BaseModel implements ImageStorable {
  static modelKey = 'article';

  title?: string;
  content?: string;
  excerpt?: string | null;
  category?: string | null;
  storageDisk?: string | null;
  storagePath?: string | null;
  published?: boolean;
  authorId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  storageDir(): string {
    return 'articles';
  }

  storageVirtualPath(): string {
    return `${this.storageDir()}/${this.id}`;
  }

  resolveImageUrl(): string | null {
    if (this.storageDisk === 'url' && this.storagePath) {
      return this.storagePath;
    }
    return this.storageDisk && this.storagePath
      ? StorageFactory.disk(this.storageDisk).url(this.storagePath)
      : null;
  }
}
