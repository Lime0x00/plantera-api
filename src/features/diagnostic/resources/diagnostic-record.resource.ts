import { Resource } from '#common/types/http/resources';
import type { DiagnosticRecord } from '#features/diagnostic/domain';
import type { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';

export type DiagnosticRecordSchema = {
  id: number;
  type: string;
  status: string;
  imageUrl: string | null;
  result: unknown;
  error: string | null;
  plantId: number | null;
  myPlantId: number | null;
  createdAt: string;
  updatedAt: string;
};

export class DiagnosticRecordResource extends Resource<
  DiagnosticRecord,
  DiagnosticRecordSchema
> {
  protected transform(rec: DiagnosticRecord): DiagnosticRecordSchema {
    return {
      id: rec.id,
      type: rec.type ?? '',
      status: (rec.status as DiagnosticStatus) ?? 'PROCESSING',
      imageUrl: rec.resolveImageUrl(),
      result: rec.result ?? null,
      error: rec.error ?? null,
      plantId: rec.plantId ?? null,
      myPlantId: rec.myPlantId ?? null,
      createdAt: rec.createdAt ? rec.createdAt.toISOString() : '',
      updatedAt: rec.updatedAt ? rec.updatedAt.toISOString() : '',
    };
  }
}
