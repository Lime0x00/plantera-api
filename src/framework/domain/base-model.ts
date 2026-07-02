import { plainToInstance } from 'class-transformer';

export type CastType = 'number' | 'string' | 'boolean' | 'date';

export interface ModelStatic<T extends BaseModel> {
  new (): T;
  modelKey: string;
  casts: Record<string, CastType>;
  hydrate(data: unknown): T;
  hydrateMany(data: unknown[]): T[];
}

export abstract class BaseModel {
  static modelKey: string;
  static casts: Record<string, CastType> = {};

  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  isTrashed(): boolean {
    return !!this.deletedAt;
  }

  restore(): void {
    this.deletedAt = null;
  }

  static hydrate<T extends BaseModel>(this: ModelStatic<T>, data: unknown): T {
    const instance = plainToInstance(this, data, {
      enableImplicitConversion: true,
    });
    return applyCasts(this, instance);
  }

  static hydrateMany<T extends BaseModel>(
    this: ModelStatic<T>,
    data: unknown[]
  ): T[] {
    return data.map((item) => this.hydrate.call(this, item));
  }
}

function applyCasts<T extends BaseModel>(
  model: { casts: Record<string, CastType> },
  instance: T
): T {
  for (const [key, type] of Object.entries(model.casts)) {
    const value = (instance as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    switch (type) {
      case 'number':
        (instance as Record<string, unknown>)[key] = Number(value);
        break;
      case 'string':
        (instance as Record<string, unknown>)[key] = String(value);
        break;
      case 'boolean':
        (instance as Record<string, unknown>)[key] = Boolean(value);
        break;
      case 'date':
        (instance as Record<string, unknown>)[key] = new Date(
          value as string | number
        );
        break;
    }
  }
  return instance;
}
