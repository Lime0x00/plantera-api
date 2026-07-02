import Redis from 'ioredis';

import { ICacheDriver } from '#infrastructure/cache/cache-driver.interface';

export interface RedisCacheDriverConfig {
  host: string;
  port: number;
  password?: string;
}

export class RedisCacheDriver implements ICacheDriver {
  private client: Redis | null = null;
  private config: RedisCacheDriverConfig;

  constructor(config: RedisCacheDriverConfig) {
    this.config = config;
  }

  public async connect(): Promise<void> {
    if (!this.client) {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password || undefined,
        lazyConnect: true,
      });
    }
    await this.client.connect();
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    const client = this.getClient();
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await client.set(key, data, 'EX', ttlSeconds);
    } else {
      await client.set(key, data);
    }
  }

  public async setMany<T>(
    entries: { key: string; value: T; ttlSeconds?: number }[]
  ): Promise<void> {
    const client = this.getClient();
    const pipeline = client.pipeline();
    for (const { key, value, ttlSeconds } of entries) {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds !== undefined) {
        pipeline.set(key, data, 'EX', ttlSeconds);
      } else {
        pipeline.set(key, data);
      }
    }
    await pipeline.exec();
  }

  public async add<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<boolean> {
    const client = this.getClient();
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    const result =
      ttlSeconds !== undefined
        ? await client.set(key, data, 'EX', ttlSeconds, 'NX')
        : await client.set(key, data, 'NX');
    return result === 'OK';
  }

  public async lock(key: string, ttlSeconds: number): Promise<boolean> {
    const client = this.getClient();
    const result = await client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  public async unlock(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  public async delete(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  public async deleteMany(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }
    const client = this.getClient();
    await client.del(...keys);
  }

  public async has(key: string): Promise<boolean> {
    const client = this.getClient();
    const exists = await client.exists(key);
    return exists === 1;
  }

  public async pull<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    const data = await client.get(key);
    if (!data) {
      return null;
    }
    await client.del(key);
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  public async increment(key: string, amount: number = 1): Promise<number> {
    const client = this.getClient();
    return client.incrby(key, amount);
  }

  public async decrement(key: string, amount: number = 1): Promise<number> {
    const client = this.getClient();
    return client.decrby(key, amount);
  }

  public async clear(): Promise<void> {
    const client = this.getClient();
    await client.flushdb();
  }

  private getClient(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password || undefined,
      });
    }
    return this.client;
  }
}
