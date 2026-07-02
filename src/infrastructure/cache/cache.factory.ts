import { ICacheDriver } from '#infrastructure/cache/cache-driver.interface';
import { RedisCacheDriver } from '#infrastructure/cache/drivers';
import { config } from '#common/helpers';

export class CacheFactory {
  private static activeDriver: ICacheDriver;

  public static driver(): ICacheDriver {
    if (this.activeDriver) {
      return this.activeDriver;
    }

    switch (config<string>('cache.driver')) {
      case 'REDIS':
      default: {
        const host = config<string>('cache.redis.host', 'localhost');
        const port = config<number>('cache.redis.port', 6379);
        const password = config<string>('cache.redis.password', '');

        this.activeDriver = new RedisCacheDriver({
          host,
          port,
          password,
        });
        break;
      }
    }

    return this.activeDriver;
  }
}
