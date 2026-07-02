import { FindUniqueArgs, FindManyArgs } from '#common/types/database';
import { Plant } from './domain';

export interface PlantWhereUniqueInput {
  id?: number;
  name?: string;
}

export interface IPlantRepository {
  findMany(args?: FindManyArgs<Record<string, unknown>>): Promise<Plant[]>;
  findById(args: FindUniqueArgs<PlantWhereUniqueInput>): Promise<Plant | null>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}
