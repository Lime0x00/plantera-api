export interface ICacheDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  setMany<T>(
    entries: { key: string; value: T; ttlSeconds?: number }[]
  ): Promise<void>;
  add<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  has(key: string): Promise<boolean>;
  pull<T>(key: string): Promise<T | null>;
  increment(key: string, amount?: number): Promise<number>;
  decrement(key: string, amount?: number): Promise<number>;
  clear(): Promise<void>;
  lock(key: string, ttlSeconds: number): Promise<boolean>;
  unlock(key: string): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
