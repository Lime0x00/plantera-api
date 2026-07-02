import { faker } from '@faker-js/faker';

export interface DiagnosticFactoryData {
  userId: number;
  plantId?: number | null;
  myPlantId?: number | null;
  type: string;
  status: string;
  storageDisk?: string | null;
  storagePath?: string | null;
  result?: unknown;
  error?: string | null;
}

export function makeDiagnostic(
  userId: number,
  data?: Partial<DiagnosticFactoryData>
): DiagnosticFactoryData {
  return {
    userId,
    plantId: data?.plantId ?? null,
    myPlantId: data?.myPlantId ?? null,
    type: data?.type ?? faker.helpers.arrayElement(['classify', 'diagnose']),
    status: data?.status ?? faker.helpers.arrayElement(['completed', 'failed']),
    storageDisk: data?.storageDisk ?? null,
    storagePath: data?.storagePath ?? null,
    result: data?.result ?? { predictions: [] },
    error: data?.error ?? null,
  };
}

export function makeDiagnostics(
  userId: number,
  count: number
): DiagnosticFactoryData[] {
  return Array.from({ length: count }, () => makeDiagnostic(userId));
}
