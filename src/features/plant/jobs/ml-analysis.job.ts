import { QueueService } from '#infrastructure/queue/queue.service';

export enum MlJobType {
  CLASSIFY = 'classify',
  DIAGNOSE = 'diagnose',
}

export interface MlJobPayload {
  jobType: MlJobType;
  recordId: number;
  storagePath: string;
  storageDisk: string;
  imageMimeType: string;
  imageUrl?: string;
  userId: number;
}

const ML_ANALYSIS_QUEUE = 'ml-analysis';

const ML_ANALYSIS_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2000 },
};

export async function dispatchMlAnalysis(
  queueService: QueueService,
  payload: MlJobPayload
): Promise<void> {
  await queueService.dispatch(
    ML_ANALYSIS_QUEUE,
    payload.jobType,
    payload,
    ML_ANALYSIS_JOB_OPTIONS
  );
}
