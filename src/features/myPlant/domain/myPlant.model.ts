import { BaseModel } from '#framework/domain/base-model';
import { Plant } from '#features/plant/domain/plant.model';
import type { ImageStorable } from '#framework/domain/interfaces';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export class MyPlantModel extends BaseModel implements ImageStorable {
  static modelKey = 'myPlant';

  id!: number;
  userId?: number;
  plantId?: number;
  wateringFrequency?: number | null;
  fertilizingFrequency?: number | null;
  lastWatered?: Date | null;
  lastFertilized?: Date | null;
  nextWatering?: Date | null;
  nextFertilizing?: Date | null;
  storageDisk?: string | null;
  storagePath?: string | null;

  plant?: Plant;

  static calculateNextDate(
    frequencyDays: number | null | undefined,
    baseDate: Date = new Date()
  ): Date | null {
    if (frequencyDays == null) {
      return null;
    }
    const next = new Date(baseDate.getTime());
    next.setDate(next.getDate() + frequencyDays);
    return next;
  }

  storageDir(): string {
    return `my-plants/${this.userId}`;
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
