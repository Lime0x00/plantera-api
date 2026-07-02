import type { FindManyArgs, CreateArgs } from '#common/types';
import { CareLog } from './domain';

export interface CareLogCreateInput {
  userId: number;
  myPlantId: number;
  type: string;
}

export interface ICareLogRepository {
  create(args: CreateArgs<CareLogCreateInput>): Promise<CareLog>;
  findMany(args?: FindManyArgs<Record<string, unknown>>): Promise<CareLog[]>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}
