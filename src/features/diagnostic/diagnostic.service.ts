import { NotFoundError } from '#common/errors';
import { DiagnosticErrors } from './diagnostic.errors';
import { IDiagnosticRepository } from './diagnostic.repository.interface';
import { DiseaseService } from '#features/disease';
import { Disease } from '#features/disease/domain';
import {
  StorageService,
  type StoredFile,
} from '#infrastructure/storage/storage.service';
import { StoragePathResolver } from '#infrastructure/storage/storage-path.resolver';
import { config, offset, paginate } from '#common/helpers';
import { DiagnosticStatus } from './diagnostic.types';
import { DiagnosticRecord } from './domain';
import { MlClient } from '#infrastructure/plant-analyzer-client';
import type { MlDiagnoseDetection } from '#infrastructure/plant-analyzer-client/types';
import { Logger } from '#infrastructure/observability/logger';

interface EnrichedDetection {
  name: string;
  otherNames: string[];
  type: string[];
  causes: string[];
  symptoms: string[];
  treatment: Record<string, unknown> | null;
  description: string;
  imageUrl: string | null;
  instances: MlDiagnoseDetection['instances'];
}

interface DiagnosticServiceDeps {
  diagnosticRepository: IDiagnosticRepository;
  diseaseService: DiseaseService;
  storageService: StorageService;
}

export class DiagnosticService {
  #repository: IDiagnosticRepository;
  #diseaseService: DiseaseService;
  #mlClient: MlClient;
  #storage: StorageService;

  constructor({
    diagnosticRepository,
    diseaseService,
    storageService,
  }: DiagnosticServiceDeps) {
    this.#repository = diagnosticRepository;
    this.#diseaseService = diseaseService;
    this.#storage = storageService;
    this.#mlClient = new MlClient({
      baseUrl: config<string>('app.analyzer_url', 'http://localhost:5000/v1'),
    });
  }

  async diagnose(
    userId: number,
    imageBuffer?: Buffer,
    mimeType?: string,
    imageUrl?: string
  ) {
    const record = await this.createRecord(
      userId,
      'diagnose',
      DiagnosticStatus.PROCESSING
    );

    let storedFile: StoredFile | undefined;
    let imageUrlResolved: string;

    if (imageUrl) {
      imageUrlResolved = imageUrl;
    } else {
      const ext = (mimeType ?? 'image/jpeg').split('/')[1] || 'jpg';
      storedFile = await this.#storage.upload(
        StoragePathResolver.forModel(record, ext),
        {
          filename: `diagnostic.${ext}`,
          buffer: imageBuffer!,
          mimeType: mimeType ?? 'image/jpeg',
          size: imageBuffer!.length,
        }
      );
      imageUrlResolved = this.#storage.resolve(storedFile);
    }

    try {
      const mlResult = await this.#mlClient.diagnose(
        imageBuffer!,
        mimeType ?? 'image/jpeg'
      );
      const enriched = await this.#enrichDetections(mlResult.data?.detections);
      return this.#saveResult(record, enriched, imageUrlResolved, storedFile);
    } catch (err) {
      await this.#handleError(record, err, storedFile?.path);
      throw err;
    }
  }

  async createRecord(
    userId: number,
    type: string,
    status: DiagnosticStatus = DiagnosticStatus.PENDING,
    plantId?: number | null,
    myPlantId?: number | null
  ) {
    return this.#repository.create({
      data: {
        userId,
        type,
        status,
        ...(plantId !== undefined ? { plantId } : {}),
        ...(myPlantId !== undefined ? { myPlantId } : {}),
      },
    });
  }

  async #enrichDetections(
    detections: MlDiagnoseDetection[] | undefined
  ): Promise<EnrichedDetection[]> {
    if (!detections?.length) {
      return [];
    }

    const enriched = await Promise.all(
      detections.map(async (d) => {
        const dbDiseases = await this.#diseaseService.findByName(d.class);
        const db = dbDiseases[0];
        if (!db) {
          return null;
        }
        return {
          name: db.name,
          otherNames: Disease.extractArray(db.otherNames),
          type: Disease.splitCommaField(db.type),
          causes: Disease.splitCommaField(db.causes),
          symptoms: Disease.splitCommaField(db.symptoms),
          treatment: db.treatment ?? null,
          description: db.description ?? '',
          imageUrl: db.imageUrl ?? null,
          instances: d.instances,
        };
      })
    );

    const valid = enriched.filter((e): e is EnrichedDetection => e !== null);
    return valid;
  }

  async #saveResult(
    record: DiagnosticRecord,
    detections: EnrichedDetection[],
    imageUrl: string,
    storedFile?: StoredFile
  ) {
    await this.#repository.update({
      where: { id: record.id },
      data: {
        status: DiagnosticStatus.COMPLETED,
        storageDisk: storedFile?.disk ?? null,
        storagePath: storedFile?.path ?? null,
        result: { detections, imageUrl },
      },
    });
    return { image: imageUrl, detections };
  }

  async #handleError(
    record: DiagnosticRecord,
    err: unknown,
    storagePath?: string
  ) {
    await this.#repository.update({
      where: { id: record.id },
      data: {
        status: DiagnosticStatus.FAILED,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    });
    if (storagePath) {
      this.#storage
        .delete(storagePath)
        .catch(() =>
          Logger.warn(`[Diagnostic] Failed to clean up ${storagePath}`)
        );
    }
  }

  async updateRecordStatus(
    recordId: number,
    status: DiagnosticStatus,
    data?: { result?: unknown; error?: string }
  ) {
    const updateData: Record<string, unknown> = { status };
    if (data?.result !== undefined) {
      updateData.result = data.result;
    }
    if (data?.error !== undefined) {
      updateData.error = data.error;
    }
    return this.#repository.update({
      where: { id: recordId },
      data: updateData,
    });
  }

  async getRecord(userId: number, recordId: number): Promise<DiagnosticRecord> {
    const record = await this.#repository.findUnique({
      where: { id: recordId },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundError(DiagnosticErrors.NOT_FOUND);
    }
    return record;
  }

  async listRecords(userId: number, page: number, limit: number) {
    const [records, totalCount] = await Promise.all([
      this.#repository.findMany({
        where: { userId },
        skip: offset(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.#repository.count({ where: { userId } }),
    ]);
    return { records, ...paginate(totalCount, page, limit) };
  }
}
