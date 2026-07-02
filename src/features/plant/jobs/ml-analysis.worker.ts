import type { AwilixContainer } from 'awilix';
import type { IJob } from '#infrastructure/queue/queue-driver.interface';
import type { QueueService } from '#infrastructure/queue/queue.service';
import type { DiagnosticService } from '#features/diagnostic';
import type { PlantService } from '#features/plant';
import type { DiseaseService } from '#features/disease';
import { StorageService } from '#infrastructure/storage/storage.service';
import { config } from '#common/helpers';
import { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';
import type { MlJobPayload } from './ml-analysis.job';
import { MlJobType } from './ml-analysis.job';
import { Logger } from '#infrastructure/observability/logger';
import { MlClient } from '#infrastructure/plant-analyzer-client';

export function registerMlAnalysisWorker(
  queueService: QueueService,
  container: AwilixContainer
) {
  const mlBaseUrl = config<string>(
    'app.analyzer_url',
    'http://127.0.0.1:5000/v1'
  );
  const mlClient = new MlClient({ baseUrl: mlBaseUrl });
  const storageService = container.resolve<StorageService>('storageService');
  const diagnosticService =
    container.resolve<DiagnosticService>('diagnosticService');
  const plantService = container.resolve<PlantService>('plantService');
  const diseaseService = container.resolve<DiseaseService>('diseaseService');

  queueService.process('ml-analysis', async (job: IJob<MlJobPayload>) => {
    const payload = job.data;

    await diagnosticService.updateRecordStatus(
      payload.recordId,
      DiagnosticStatus.PROCESSING
    );

    try {
      const imageBuffer = payload.imageUrl
        ? await fetch(payload.imageUrl)
            .then((r) => r.arrayBuffer())
            .then((ab) => Buffer.from(ab))
        : await storageService.get(payload.storagePath);

      if (payload.jobType === MlJobType.CLASSIFY) {
        await handleClassify(
          payload,
          imageBuffer,
          mlClient,
          diagnosticService,
          plantService,
          job
        );
      } else if (payload.jobType === MlJobType.DIAGNOSE) {
        await handleDiagnose(
          payload,
          imageBuffer,
          mlClient,
          diagnosticService,
          diseaseService,
          job
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown ML analysis error';
      Logger.error(
        `[MlWorker] Job ${payload.jobType}/${payload.recordId} failed: ${message}`
      );
      await diagnosticService.updateRecordStatus(
        payload.recordId,
        DiagnosticStatus.FAILED,
        { error: message }
      );
      throw err;
    }
  });
}

async function handleClassify(
  payload: MlJobPayload,
  imageBuffer: Buffer,
  mlClient: MlClient,
  diagnosticService: DiagnosticService,
  plantService: PlantService,
  job: IJob<MlJobPayload>
) {
  await job.log('Calling ML classification service...');

  const mlResult = await mlClient.classify(imageBuffer, payload.imageMimeType);
  const predictions = mlResult.data || [];
  await job.log(`ML returned ${predictions.length} predictions`);

  const enriched = await Promise.all(
    predictions.map(async (p) => {
      const plants = await plantService.findByClassifierName(p.class_name);
      return {
        classId: p.class_id,
        className: p.class_name,
        confidence: p.confidence,
        plantId: plants[0]?.id ?? null,
      };
    })
  );

  await diagnosticService.updateRecordStatus(
    payload.recordId,
    DiagnosticStatus.COMPLETED,
    {
      result: { predictions: enriched },
    }
  );
  await job.log('Classification completed and stored.');
}

async function handleDiagnose(
  payload: MlJobPayload,
  imageBuffer: Buffer,
  mlClient: MlClient,
  diagnosticService: DiagnosticService,
  diseaseService: DiseaseService,
  job: IJob<MlJobPayload>
) {
  await job.log('Calling ML diagnosis service...');

  const mlResult = await mlClient.diagnose(imageBuffer, payload.imageMimeType);
  const detections = mlResult.data?.detections || [];
  await job.log(`ML returned ${detections.length} unique diseases`);

  const enriched = await Promise.all(
    detections.map(async (d) => {
      const diseases = await diseaseService.findByName(d.class);
      return {
        disease: d.class,
        diseaseId: diseases[0]?.id ?? null,
        instances: d.instances,
      };
    })
  );

  await diagnosticService.updateRecordStatus(
    payload.recordId,
    DiagnosticStatus.COMPLETED,
    {
      result: { detections: enriched },
    }
  );
  await job.log('Diagnosis completed and stored.');
}
