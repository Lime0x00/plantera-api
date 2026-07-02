import type { ImageStorable } from '#framework/domain/interfaces';

export class StoragePathResolver {
  static forModel(model: ImageStorable, ext: string): string {
    return `${model.storageVirtualPath()}.${ext}`;
  }
}
