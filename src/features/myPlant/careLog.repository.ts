import { BaseRepository } from '#infrastructure/database/base-repository';
import {
  ICareLogRepository,
  CareLogCreateInput,
} from './careLog.repository.interface';
import { CareLog } from './domain';

export class CareLogRepository
  extends BaseRepository<
    CareLog,
    Record<string, unknown>,
    Record<string, unknown>,
    CareLogCreateInput,
    Record<string, unknown>
  >
  implements ICareLogRepository
{
  public constructor() {
    super(CareLog);
  }

  async count(args?: { where?: Record<string, unknown> }): Promise<number> {
    return this.driver.count({ where: args?.where || {} });
  }

  async findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
  }): Promise<CareLog[]> {
    const raw = await this.driver.findMany(args || {});
    return CareLog.hydrateMany(raw);
  }
}
