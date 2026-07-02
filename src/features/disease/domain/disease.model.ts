import { BaseModel } from '#framework/domain/base-model';

export class Disease extends BaseModel {
  static modelKey = 'disease';

  name?: string;
  otherNames?: string[] | null;
  type?: string | null;
  causes?: string | null;
  symptoms?: string | null;
  treatment?: Record<string, unknown> | null;
  description?: string | null;
  imageUrl?: string | null;

  static splitCommaField(value: string | null | undefined): string[] {
    return value
      ? value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }

  static extractArray(value: unknown): string[] {
    if (Array.isArray(value)) return value as string[];
    return Disease.splitCommaField(value as string | null | undefined);
  }
}
