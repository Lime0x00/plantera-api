import { SoftDeleteScope } from '#common/types/database';
import { IDatabaseClient } from './database-driver.interface';
import { DatabaseDriverFactory } from './driver.factory';
import type { BaseModel, ModelStatic } from '#framework/domain/base-model';

export interface IRepositoryObserver<T> {
  created?: (entity: T) => Promise<void> | void;
  updated?: (entity: T) => Promise<void> | void;
  deleted?: (entity: T) => Promise<void> | void;
}

export abstract class BaseRepository<
  TEntity extends BaseModel,
  TWhereUnique extends object,
  TWhereMany extends object,
  TCreateData extends object,
  TUpdateData extends object,
> {
  private observers: IRepositoryObserver<TEntity>[] = [];
  protected driver: IDatabaseClient<
    TEntity,
    TWhereUnique,
    TWhereMany,
    TCreateData,
    TUpdateData
  >;
  private scope: SoftDeleteScope = 'withoutTrashed';

  constructor(private model: ModelStatic<TEntity>) {
    this.driver = DatabaseDriverFactory.getDriver<
      TEntity,
      TWhereUnique,
      TWhereMany,
      TCreateData,
      TUpdateData
    >(this.model.modelKey);
  }

  onlyTrashed(): this {
    this.scope = 'onlyTrashed';
    return this;
  }
  withTrashed(): this {
    this.scope = 'withTrashed';
    return this;
  }
  withoutTrashed(): this {
    this.scope = 'withoutTrashed';
    return this;
  }

  private scoped<T>(args: T): T {
    if (this.scope === 'withTrashed') {
      return args;
    }
    const q = {
      ...args,
      where: {
        ...((args as { where?: Record<string, unknown> })?.where || {}),
      },
    };
    if (this.scope === 'withoutTrashed') q.where.deletedAt = null;
    else if (this.scope === 'onlyTrashed')
      q.where.deletedAt = { gte: new Date('1970-01-01') };
    return q;
  }

  public registerObserver(observer: IRepositoryObserver<TEntity>): void {
    this.observers.push(observer);
  }

  private async notify(
    event: keyof IRepositoryObserver<TEntity>,
    entity: TEntity
  ): Promise<void> {
    for (const obs of this.observers) {
      const cb = obs[event];
      if (typeof cb === 'function') {
        await cb.call(obs, entity);
      }
    }
  }

  public async findUnique(args: {
    where: TWhereUnique;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
  }): Promise<TEntity | null> {
    const raw = await this.driver.findUnique(args);
    if (!raw) {
      return null;
    }
    const entity = this.model.hydrate(raw);

    if (this.scope === 'withoutTrashed' && entity.isTrashed()) return null;
    if (this.scope === 'onlyTrashed' && !entity.isTrashed()) return null;

    return entity;
  }

  public async findMany(args?: {
    where?: TWhereMany;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
    orderBy?:
      | Record<string, 'asc' | 'desc'>
      | Array<Record<string, 'asc' | 'desc'>>;
    skip?: number;
    take?: number;
  }): Promise<TEntity[]> {
    const raw = await this.driver.findMany(
      this.scoped(args || { where: {} as TWhereMany })
    );
    return this.model.hydrateMany(raw);
  }

  public async count(args?: { where?: TWhereMany }): Promise<number> {
    return this.driver.count(this.scoped(args || {}));
  }

  public async create(args: {
    data: TCreateData;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
  }): Promise<TEntity> {
    const entity = this.model.hydrate(await this.driver.create(args));
    await this.notify('created', entity);
    return entity;
  }

  public async update(args: {
    where: TWhereUnique;
    data: TUpdateData;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
  }): Promise<TEntity> {
    if (this.scope !== 'withTrashed') {
      const existing = await this.findUnique({ where: args.where });
      if (!existing) {
        throw new Error('Record not found or not in scope');
      }
    }
    const entity = this.model.hydrate(await this.driver.update(args));
    await this.notify('updated', entity);
    return entity;
  }

  public async updateSilent(args: {
    where: TWhereUnique;
    data: TUpdateData;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
  }): Promise<TEntity> {
    if (this.scope !== 'withTrashed') {
      const existing = await this.findUnique({ where: args.where });
      if (!existing) {
        throw new Error('Record not found or not in scope');
      }
    }
    const entity = this.model.hydrate(await this.driver.update(args));
    return entity;
  }

  public async delete(args: {
    where: TWhereUnique;
    force?: boolean;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
  }): Promise<TEntity> {
    const raw = args.force
      ? await this.driver.delete({ where: args.where })
      : await this.driver.update({
          where: args.where,
          data: { deletedAt: new Date() } as unknown as TUpdateData,
        });
    const entity = this.model.hydrate(raw);
    await this.notify('deleted', entity);
    return entity;
  }

  public async forceDelete(args: { where: TWhereUnique }): Promise<TEntity> {
    return this.delete({ ...args, force: true });
  }

  public async restore(args: {
    where: TWhereUnique;
    select?: Record<string, boolean>;
    include?: Record<string, boolean | object>;
  }): Promise<TEntity> {
    return this.model.hydrate(
      await this.driver.update({
        where: args.where,
        data: { deletedAt: null } as unknown as TUpdateData,
      })
    );
  }
}
