import {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  UpdateArgs,
  DeleteArgs,
} from '#common/types/database';
import { MyPlantModel } from './domain';

export interface MyPlantWhereUniqueInput {
  id?: number;
}

export interface MyPlantCreateInput {
  userId: number;
  plantId: number;
  storageDisk?: string | null;
  storagePath?: string | null;
  wateringFrequency?: number | null;
  fertilizingFrequency?: number | null;
  lastWatered?: Date | string | null;
  lastFertilized?: Date | string | null;
  nextWatering?: Date | string | null;
  nextFertilizing?: Date | string | null;
}

export interface MyPlantUpdateInput {
  storageDisk?: string | null;
  storagePath?: string | null;
  wateringFrequency?: number | null;
  fertilizingFrequency?: number | null;
  lastWatered?: Date | string | null;
  lastFertilized?: Date | string | null;
  nextWatering?: Date | string | null;
  nextFertilizing?: Date | string | null;
}

export interface IMyPlantRepository {
  withTrashed(): this;
  withoutTrashed(): this;
  restore(args: { where: MyPlantWhereUniqueInput }): Promise<MyPlantModel>;
  create(args: CreateArgs<MyPlantCreateInput>): Promise<MyPlantModel>;
  findUnique(
    args: FindUniqueArgs<MyPlantWhereUniqueInput>
  ): Promise<MyPlantModel | null>;
  findMany(
    args?: FindManyArgs<Record<string, unknown>>,
    scopeOverride?: 'withTrashed' | 'withoutTrashed' | 'onlyTrashed'
  ): Promise<MyPlantModel[]>;
  update(
    args: UpdateArgs<MyPlantWhereUniqueInput, MyPlantUpdateInput>
  ): Promise<MyPlantModel>;
  delete(args: DeleteArgs<MyPlantWhereUniqueInput>): Promise<MyPlantModel>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}
