import { IStorageDriver } from '#infrastructure/storage/storage.interface';
import {
  LocalStorageDriver,
  CloudinaryStorageDriver,
} from '#infrastructure/storage/drivers';
import { config } from '#common/helpers';
import { FilesystemDriver } from '#config/filesystem';

export class StorageFactory {
  private static drivers: Map<string, IStorageDriver> = new Map();

  private static defaultDisk(): FilesystemDriver {
    return config<FilesystemDriver>('filesystem.driver');
  }

  public static disk(name?: string): IStorageDriver {
    const diskName = (name ?? this.defaultDisk()).toUpperCase();
    const existing = this.drivers.get(diskName);
    if (existing) {
      return existing;
    }

    let driver: IStorageDriver;
    switch (diskName) {
      case 'CLOUDINARY':
        driver = new CloudinaryStorageDriver();
        break;
      case 'LOCAL':
      default:
        driver = new LocalStorageDriver();
        break;
    }

    this.drivers.set(diskName, driver);
    return driver;
  }

  public static currentDisk(): string {
    return this.defaultDisk();
  }
}
