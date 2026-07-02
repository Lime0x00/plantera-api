import { IUploadedFile } from '#common/types/storage/storage.types';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export type StoredFile = {
  disk: string;
  path: string;
};

export class StorageService {
  constructor() {}

  public async upload(path: string, file: IUploadedFile): Promise<StoredFile> {
    const diskDriver = StorageFactory.disk();
    const result = await diskDriver.put(path, file);
    return { disk: StorageFactory.currentDisk(), path: result };
  }

  public async uploadTo(
    disk: 'LOCAL' | 'CLOUDINARY',
    path: string,
    file: IUploadedFile
  ): Promise<StoredFile> {
    const driver = StorageFactory.disk(disk);
    const result = await driver.put(path, file);
    return { disk, path: result };
  }

  public async delete(path: string): Promise<void> {
    const diskDriver = StorageFactory.disk();
    return diskDriver.delete(path);
  }

  public async get(path: string): Promise<Buffer> {
    const diskDriver = StorageFactory.disk();
    return diskDriver.get(path);
  }

  public resolve(stored: StoredFile): string {
    const driver = StorageFactory.disk(stored.disk as 'LOCAL' | 'CLOUDINARY');
    return driver.url(stored.path);
  }
}
