import { BaseModel } from '#framework/domain/base-model';
import type { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';
import type { ImageStorable } from '#framework/domain/interfaces';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export interface DetectionResult {
  class: string;
  confidence: number;
  bbox: number[];
}

export interface ClassificationResult {
  class_id: number;
  class_name: string;
  confidence: number;
}

export class DiagnosticRecord extends BaseModel implements ImageStorable {
  static modelKey = 'diagnosticRecord';
  id!: number;

  userId?: number;
  plantId?: number | null;
  myPlantId?: number | null;
  type?: string;
  status?: DiagnosticStatus;
  storageDisk?: string | null;
  storagePath?: string | null;
  result?: unknown;
  error?: string | null;

  get detections(): DetectionResult[] {
    if (!Array.isArray(this.result)) return [];
    return this.result as DetectionResult[];
  }

  storageDir(): string {
    return `diagnostics/${this.userId}`;
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
