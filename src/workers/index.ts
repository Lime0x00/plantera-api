import type { AwilixContainer } from 'awilix';
import { QueueService } from '#infrastructure/queue/queue.service';
import { registerNotificationWorker } from './notification.worker';
import { registerMlAnalysisWorker } from '#features/plant/jobs/ml-analysis.worker';
import { registerCareReminderWorker } from './care-reminder.worker';

export function registerAllWorkers(
  queueService: QueueService,
  container: AwilixContainer
) {
  registerNotificationWorker(queueService, container);
  registerMlAnalysisWorker(queueService, container);
  registerCareReminderWorker(queueService, container);
}
