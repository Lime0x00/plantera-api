import type { $Enums } from '#common/types/generated/prisma';

export type DiagnosticType = $Enums.DiagnosticType;
export type DiagnosticStatusEnum = $Enums.DiagnosticStatusEnum;

export const DiagnosticStatus = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
} as const;

export type DiagnosticStatus =
  (typeof DiagnosticStatus)[keyof typeof DiagnosticStatus];

export type DiagnosticWhereInput = Record<string, unknown>;
