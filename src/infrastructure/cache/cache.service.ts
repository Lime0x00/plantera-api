import { ICacheDriver } from '#infrastructure/cache/cache-driver.interface';
import { CacheFactory } from '#infrastructure/cache/cache.factory';

const LOCK_RETRY_BASE_DELAY = 50;
const LOCK_RETRY_MAX = 10;

export class CacheService {
  private cacheDriver: ICacheDriver;

  constructor() {
    this.cacheDriver = CacheFactory.driver();
  }

  public getDriver(): ICacheDriver {
    return this.cacheDriver;
  }

  public async get<T>(key: string): Promise<T | null> {
    return this.cacheDriver.get<T>(key);
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    return this.cacheDriver.set<T>(key, value, ttlSeconds);
  }

  public async setMany<T>(
    entries: { key: string; value: T; ttlSeconds?: number }[]
  ): Promise<void> {
    return this.cacheDriver.setMany(entries);
  }

  public async add<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<boolean> {
    return this.cacheDriver.add(key, value, ttlSeconds);
  }

  public async delete(key: string): Promise<void> {
    return this.cacheDriver.delete(key);
  }

  public async deleteMany(keys: string[]): Promise<void> {
    return this.cacheDriver.deleteMany(keys);
  }

  public async has(key: string): Promise<boolean> {
    return this.cacheDriver.has(key);
  }

  public async pull<T>(key: string): Promise<T | null> {
    return this.cacheDriver.pull<T>(key);
  }

  public async increment(key: string, amount?: number): Promise<number> {
    return this.cacheDriver.increment(key, amount);
  }

  public async decrement(key: string, amount?: number): Promise<number> {
    return this.cacheDriver.decrement(key, amount);
  }

  public async clear(): Promise<void> {
    return this.cacheDriver.clear();
  }

  public async remember<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const lockKey = `${key}:lock`;
    const acquired = await this.cacheDriver.lock(lockKey, 10);

    if (acquired) {
      try {
        const recheck = await this.get<T>(key);
        if (recheck !== null) {
          return recheck;
        }

        const value = await fetcher();
        await this.set(key, value, ttlSeconds);
        return value;
      } finally {
        await this.cacheDriver.unlock(lockKey);
      }
    }

    return this.#waitAndFallback(key, fetcher, 1);
  }

  public async rememberForever<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const lockKey = `${key}:lock`;
    const acquired = await this.cacheDriver.lock(lockKey, 10);

    if (acquired) {
      try {
        const recheck = await this.get<T>(key);
        if (recheck !== null) {
          return recheck;
        }

        const value = await fetcher();
        await this.set(key, value);
        return value;
      } finally {
        await this.cacheDriver.unlock(lockKey);
      }
    }

    return this.#waitAndFallback(key, fetcher, 1);
  }

  async #waitAndFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    attempt: number
  ): Promise<T> {
    if (attempt >= LOCK_RETRY_MAX) {
      return fetcher();
    }
    await new Promise((r) =>
      setTimeout(r, LOCK_RETRY_BASE_DELAY * 2 ** (attempt - 1))
    );
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    return this.#waitAndFallback(key, fetcher, attempt + 1);
  }
}
