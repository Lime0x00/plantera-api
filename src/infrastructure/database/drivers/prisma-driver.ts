import { PrismaClient, Prisma } from '#common/types/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  IDatabaseDriver,
  IDatabaseClient,
} from '#infrastructure/database/database-driver.interface';
import { env } from '#common/env';

/**
 * Valid model names extracted from the Prisma Client.
 */
type PrismaModelName = keyof Omit<
  PrismaClient,
  | '$connect'
  | '$disconnect'
  | '$executeRaw'
  | '$executeRawUnsafe'
  | '$on'
  | '$queryRaw'
  | '$queryRawUnsafe'
  | '$transaction'
  | '$use'
  | '$extends'
>;

/**
 * Prisma implementation of the IDatabaseDriver.
 */
export class PrismaDriver implements IDatabaseDriver<Prisma.TransactionClient> {
  private prisma: PrismaClient;
  private pool: pg.Pool;

  constructor() {
    const url =
      env<string>('DATABASE_URL') ||
      'postgresql://postgres:postgres@localhost:5432/depiplant';

    this.pool = new pg.Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(this.pool);

    this.prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });
  }

  /**
   * Resolve a type-safe model delegate from Prisma.
   */
  public getClient<
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
    const key = modelKey as PrismaModelName;
    const model = (this.prisma as unknown as Record<string, unknown>)[
      key as string
    ];

    if (!model) {
      throw new Error(
        `PrismaDriver Error: Model [${modelKey}] not found in PrismaClient.`
      );
    }

    // Prisma delegates implement findUnique, findMany, etc.
    // We cast to our IDatabaseClient which matches the Prisma signature.
    return model as unknown as IDatabaseClient<
      TEntity,
      TWhereUnique,
      TWhereMany,
      TCreateData,
      TUpdateData
    >;
  }

  public async transaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.pool.end();
  }

  public async connect(): Promise<void> {
    await this.prisma.$connect();
  }
}

export default PrismaDriver;
