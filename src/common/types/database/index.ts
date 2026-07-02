export type SoftDeleteScope = 'withTrashed' | 'withoutTrashed' | 'onlyTrashed';

/**
 * Agnostic Query Filter
 */
export type QueryFilter = Record<string, unknown>;

/**
 * Agnostic Arguments for FindUnique
 */
export interface FindUniqueArgs<
  TWhere extends object = Record<string, unknown>,
> {
  where: TWhere;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
}

/**
 * Agnostic Arguments for FindMany
 */
export interface FindManyArgs<TWhere extends object = Record<string, unknown>> {
  where?: TWhere;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
  orderBy?:
    | Record<string, 'asc' | 'desc'>
    | Array<Record<string, 'asc' | 'desc'>>;
  skip?: number;
  take?: number;
}

/**
 * Agnostic Arguments for Create
 */
export interface CreateArgs<TData extends object = Record<string, unknown>> {
  data: TData;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
}

/**
 * Agnostic Arguments for Update
 */
export interface UpdateArgs<
  TWhere extends object = Record<string, unknown>,
  TData extends object = Record<string, unknown>,
> {
  where: TWhere;
  data: TData;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
}

/**
 * Agnostic Arguments for Delete
 */
export interface DeleteArgs<TWhere extends object = Record<string, unknown>> {
  where: TWhere;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
  forceDelete?: boolean;
}
