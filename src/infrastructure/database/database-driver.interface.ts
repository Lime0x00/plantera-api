import {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  UpdateArgs,
  DeleteArgs,
} from '#common/types/database';

/**
 * Storage-agnostic interface for database operations.
 */
export interface IDatabaseClient<
  TEntity extends object,
  TWhereUnique extends object = Record<string, unknown>,
  TWhereMany extends object = Record<string, unknown>,
  TCreateData extends object = Record<string, unknown>,
  TUpdateData extends object = Record<string, unknown>,
> {
  findUnique(args: FindUniqueArgs<TWhereUnique>): Promise<TEntity | null>;
  findFirst(args: FindManyArgs<TWhereMany>): Promise<TEntity | null>;
  findMany(args?: FindManyArgs<TWhereMany>): Promise<TEntity[]>;
  create(args: CreateArgs<TCreateData>): Promise<TEntity>;
  update(args: UpdateArgs<TWhereUnique, TUpdateData>): Promise<TEntity>;
  delete(args: DeleteArgs<TWhereUnique>): Promise<TEntity>;
  count(args?: { where?: TWhereMany }): Promise<number>;
}

/**
 * Core Database Driver Interface.
 * TXClient is the type of the client used within transactions.
 */
export interface IDatabaseDriver<TXClient = unknown> {
  /**
   * Get a type-safe client for a specific data model.
   */
  getClient<
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
  >;

  disconnect(): Promise<void>;
  connect(): Promise<void>;
  transaction<T>(fn: (client: TXClient) => Promise<T>): Promise<T>;
}
