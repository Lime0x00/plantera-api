import { IDatabaseClient, IDatabaseDriver } from './database-driver.interface';
import { PrismaDriver } from './drivers/prisma-driver';
import { config } from '#config';

export class DatabaseDriverFactory {
  private static driverInstance: IDatabaseDriver<unknown> | null = null;

  public static getDriver<
    TEntity extends object,
    TWhereUnique extends object = Record<string, unknown>,
    TWhereMany extends object = Record<string, unknown>,
    TCreateData extends object = Record<string, unknown>,
    TUpdateData extends object = Record<string, unknown>,
  >(
    modelKey: string
  ): IDatabaseClient<
    TEntity,
    TWhereUnique,
    TWhereMany,
    TCreateData,
    TUpdateData
  > {
    if (!this.driverInstance) {
      const driverType = config.app.driver_type;

      switch (driverType) {
        case 'PRISMA':
          this.driverInstance = new PrismaDriver() as IDatabaseDriver<unknown>;
          break;
        default:
          throw new Error(
            `DatabaseDriverFactory Error: Unsupported driver type [${driverType}]`
          );
      }
    }

    return this.driverInstance.getClient<
      TEntity,
      TWhereUnique,
      TWhereMany,
      TCreateData,
      TUpdateData
    >(modelKey);
  }

  public static async disconnect(): Promise<void> {
    if (this.driverInstance) {
      await this.driverInstance.disconnect();
    }
  }
}
