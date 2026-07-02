import type { components } from './generated/openapi.types';

export type SpecSchema<T extends keyof components['schemas']> =
  components['schemas'][T];

export type ValidateContract<TSpec, TDto> = TDto extends TSpec ? true : never;
