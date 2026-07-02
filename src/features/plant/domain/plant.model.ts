import { BaseModel } from '#framework/domain/base-model';
import type { ImageStorable } from '#framework/domain/interfaces';

export class Plant extends BaseModel implements ImageStorable {
  static modelKey = 'plant';
  id!: number;

  classifierName!: string;
  commonName!: string;
  scientificName?: string | null;
  family?: string | null;
  about?: string | null;
  temperature?: string | null;
  light?: string | null;
  water?: string | null;
  whereToGrow?: string | null;
  toxicity?: string | null;
  howToGrow?: string | null;
  category?: string | null;
  kingdom?: string | null;
  order_?: string | null;
  imageUrl?: string | null;
  wateringFrequency?: number | null;
  fertilizingFrequency?: number | null;
  careInstructions?: Record<string, unknown> | null;

  storageDir(): string {
    return 'plants';
  }

  storageVirtualPath(): string {
    return `${this.storageDir()}/${this.id}`;
  }

  resolveImageUrl(): string | null {
    return this.imageUrl ?? null;
  }
}
