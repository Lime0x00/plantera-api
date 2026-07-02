import type { AwilixContainer } from 'awilix';
import { Logger } from '#infrastructure/observability/logger';
import type { QueueService } from '#infrastructure/queue/queue.service';
import type { IJob } from '#infrastructure/queue/queue-driver.interface';
import type { NotificationService } from '#features/notification/notification.service';
import type { IMyPlantRepository } from '#features/myPlant/myPlant.repository.interface';
import type { MyPlantModel } from '#features/myPlant/domain';

const CRON_EVERY_2_MIN = '*/2 * * * *';

export function registerCareReminderWorker(
  queueService: QueueService,
  container: AwilixContainer
) {
  const queueName = 'care-reminders';
  const jobName = 'check-due-care';

  queueService.schedule(
    queueName,
    jobName,
    CRON_EVERY_2_MIN,
    {},
    {
      jobId: `fixed-${jobName}`,
    }
  );

  queueService.process(queueName, async (_job: IJob) => {
    Logger.info('[CareReminderWorker] Checking due care tasks...');

    const myPlantRepository =
      container.resolve<IMyPlantRepository>('myPlantRepository');
    const notificationService = container.resolve<NotificationService>(
      'notificationService'
    );

    const now = new Date();

    const allMyPlants = await myPlantRepository.findMany({
      include: { plant: true },
    });

    const duePlants: MyPlantModel[] = [];
    for (const mp of allMyPlants) {
      const isWaterDue = mp.nextWatering && mp.nextWatering <= now;
      const isFertDue = mp.nextFertilizing && mp.nextFertilizing <= now;
      if (isWaterDue || isFertDue) {
        duePlants.push(mp);
      }
    }

    Logger.info(
      `[CareReminderWorker] Found ${duePlants.length} due plants out of ${allMyPlants.length} total`
    );

    for (const mp of duePlants) {
      const userId = mp.userId!;
      const plantName =
        (mp.plant as { name?: string } | null)?.name ?? 'Your plant';

      if (mp.nextWatering && mp.nextWatering <= now) {
        await notificationService
          .create({
            userId,
            plantId: mp.plantId!,
            type: 'watering_reminder',
            title: `Time to water ${plantName}`,
            body: `It's time to water ${plantName}.`,
            scheduledTime: mp.nextWatering,
          })
          .catch((err: Error) => {
            Logger.error(
              `[CareReminderWorker] Failed watering notif for plant ${mp.id}: ${err.message}`
            );
          });

        if (mp.wateringFrequency) {
          await myPlantRepository
            .update({
              where: { id: mp.id! },
              data: {
                nextWatering: new Date(
                  now.getTime() + mp.wateringFrequency * 86400000
                ),
              },
            })
            .catch((err: Error) => {
              Logger.error(
                `[CareReminderWorker] Failed to advance nextWatering for plant ${mp.id}: ${err.message}`
              );
            });
        }
      }

      if (mp.nextFertilizing && mp.nextFertilizing <= now) {
        await notificationService
          .create({
            userId,
            plantId: mp.plantId!,
            type: 'fertilizing_reminder',
            title: `Time to fertilize ${plantName}`,
            body: `It's time to fertilize ${plantName}.`,
            scheduledTime: mp.nextFertilizing,
          })
          .catch((err: Error) => {
            Logger.error(
              `[CareReminderWorker] Failed fertilizing notif for plant ${mp.id}: ${err.message}`
            );
          });

        if (mp.fertilizingFrequency) {
          await myPlantRepository
            .update({
              where: { id: mp.id! },
              data: {
                nextFertilizing: new Date(
                  now.getTime() + mp.fertilizingFrequency * 86400000
                ),
              },
            })
            .catch((err: Error) => {
              Logger.error(
                `[CareReminderWorker] Failed to advance nextFertilizing for plant ${mp.id}: ${err.message}`
              );
            });
        }
      }
    }

    Logger.info('[CareReminderWorker] Done checking care tasks');
  });
}
