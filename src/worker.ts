import 'reflect-metadata';
import { Logger } from '#infrastructure/observability/logger';
import { container } from './container';
import { QueueService } from '#infrastructure/queue/queue.service';
import { registerAllWorkers } from './workers/index';

async function bootstrapWorkers() {
  Logger.info('Booting workers process...');

  const queueService = container.resolve<QueueService>('queueService');

  registerAllWorkers(queueService, container);

  Logger.info('Workers booted successfully. Listening for jobs...');
}

bootstrapWorkers().catch((err) => {
  Logger.error(`Worker process crashed: ${(err as Error).message}`);
  process.exit(1);
});
