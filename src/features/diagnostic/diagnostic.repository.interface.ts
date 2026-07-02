import { DiagnosticRecord } from './domain';
import type { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';
import type {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  UpdateArgs,
} from '#common/types';

export interface DiagnosticWhereUniqueInput {
  id?: number;
}

export interface DiagnosticCreateInput {
  userId: number;
  plantId?: number | null;
  myPlantId?: number | null;
  type: string;
  status?: DiagnosticStatus;
  storageDisk?: string | null;
  storagePath?: string | null;
}

export interface DiagnosticUpdateInput {
  status?: DiagnosticStatus;
  result?: Record<string, unknown>;
  error?: string;
  storageDisk?: string | null;
  storagePath?: string | null;
  plantId?: number | null;
  myPlantId?: number | null;
}

export type DiagnosticWhereFilter = {
  userId?: number;
  myPlantId?: number;
  type?: string;
};

export interface IDiagnosticRepository {
  create(args: CreateArgs<DiagnosticCreateInput>): Promise<DiagnosticRecord>;
  findUnique(
    args: FindUniqueArgs<DiagnosticWhereUniqueInput>
  ): Promise<DiagnosticRecord | null>;
  findMany(
    args?: FindManyArgs<DiagnosticWhereFilter>
  ): Promise<DiagnosticRecord[]>;
  update(
    args: UpdateArgs<DiagnosticWhereUniqueInput, DiagnosticUpdateInput>
  ): Promise<DiagnosticRecord>;
  count(args?: { where?: DiagnosticWhereFilter }): Promise<number>;
}
