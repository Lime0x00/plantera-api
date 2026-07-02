import { BaseRepository } from '#infrastructure/database/base-repository';
import {
  IDiagnosticRepository,
  DiagnosticCreateInput,
  DiagnosticUpdateInput,
  DiagnosticWhereUniqueInput,
  DiagnosticWhereFilter,
} from './diagnostic.repository.interface';
import { DiagnosticRecord } from './domain';

export class DiagnosticRepository
  extends BaseRepository<
    DiagnosticRecord,
    DiagnosticWhereUniqueInput,
    DiagnosticWhereFilter,
    DiagnosticCreateInput,
    DiagnosticUpdateInput
  >
  implements IDiagnosticRepository
{
  public constructor() {
    super(DiagnosticRecord);
  }

  async count(args?: { where?: DiagnosticWhereFilter }): Promise<number> {
    const results = await this.findMany({
      where: (args?.where || {}) as Record<string, unknown>,
    });
    return results.length;
  }
}
