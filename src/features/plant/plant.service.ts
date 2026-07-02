import { NotFoundError } from '#common/errors';
import { PlantErrors } from './plant.errors';
import type { IPlantRepository } from './plant.repository.interface';
import { QueueService } from '#infrastructure/queue/queue.service';
import { CacheService } from '#infrastructure/cache/cache.service';
import {
  StorageService,
  StoredFile,
} from '#infrastructure/storage/storage.service';
import { StoragePathResolver } from '#infrastructure/storage/storage-path.resolver';
import { DiagnosticService } from '#features/diagnostic';
import { DiagnosticRecord } from '#features/diagnostic/domain';
import { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';
import { Logger } from '#infrastructure/observability/logger';
import { paginate, clampLimit, offset } from '#common/helpers';
import { dispatchMlAnalysis, MlJobType } from './jobs/ml-analysis.job';

interface PlantServiceDeps {
  plantRepository: IPlantRepository;
  diagnosticService: DiagnosticService;
  queueService: QueueService;
  storageService: StorageService;
  cacheService: CacheService;
}

type StoreResult = {
  storagePath: string;
  storageDisk: string;
  imageUrl: string;
};

export class PlantService {
  #repository: IPlantRepository;
  #diagnosticService: DiagnosticService;
  #queue: QueueService;
  #storage: StorageService;
  #cache: CacheService;

  constructor({
    plantRepository,
    diagnosticService,
    queueService,
    storageService,
    cacheService,
  }: PlantServiceDeps) {
    this.#repository = plantRepository;
    this.#diagnosticService = diagnosticService;
    this.#queue = queueService;
    this.#storage = storageService;
    this.#cache = cacheService;
  }

  async listPlants(filters: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = clampLimit(filters.limit ?? 20);
    const skip = offset(page, limit);
    const where: Record<string, unknown> = {};
    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { classifierName: { contains: filters.search, mode: 'insensitive' } },
        { commonName: { contains: filters.search, mode: 'insensitive' } },
        { scientificName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.search || filters.category) {
      const [data, totalCount] = await Promise.all([
        this.#repository.findMany({ where, skip, take: limit }),
        this.#repository.count({ where }),
      ]);
      return { data, meta: paginate(totalCount, page, limit) };
    }

    const cacheKey = `plants:list:page=${page}&limit=${limit}`;
    return this.#cache.remember(cacheKey, 600, async () => {
      const [data, totalCount] = await Promise.all([
        this.#repository.findMany({ where, skip, take: limit }),
        this.#repository.count({ where }),
      ]);
      return { data, meta: paginate(totalCount, page, limit) };
    });
  }

  async findByClassifierName(name: string) {
    return this.#repository.findMany({ where: { classifierName: name } });
  }

  async getPlantById(id: number) {
    const plant = await this.#repository.findById({ where: { id } });
    if (!plant) {
      throw new NotFoundError(PlantErrors.NOT_FOUND);
    }
    return { plant };
  }

  async #storeOrRecord(
    record: DiagnosticRecord,
    imageBuffer?: Buffer,
    imageMimeType?: string,
    directUrl?: string
  ): Promise<StoreResult> {
    if (directUrl) {
      return { storagePath: '', storageDisk: '', imageUrl: directUrl };
    }

    const ext = (imageMimeType ?? 'image/jpeg').split('/')[1] || 'jpg';
    const storedFile: StoredFile = await this.#storage.upload(
      StoragePathResolver.forModel(record, ext),
      {
        filename: `upload.${ext}`,
        buffer: imageBuffer!,
        mimeType: imageMimeType ?? 'image/jpeg',
        size: imageBuffer!.length,
      }
    );
    return {
      storagePath: storedFile.path,
      storageDisk: storedFile.disk,
      imageUrl: this.#storage.resolve(storedFile),
    };
  }

  async classifyPlant(
    userId: number,
    imageBuffer?: Buffer,
    imageMimeType?: string,
    imageUrl?: string
  ) {
    const record = await this.#diagnosticService.createRecord(
      userId,
      'classify'
    );
    const stored = await this.#storeOrRecord(
      record,
      imageBuffer,
      imageMimeType,
      imageUrl
    );

    dispatchMlAnalysis(this.#queue, {
      jobType: MlJobType.CLASSIFY,
      recordId: record.id,
      storagePath: stored.storagePath,
      storageDisk: stored.storageDisk,
      imageMimeType: imageMimeType ?? 'image/jpeg',
      ...(imageUrl && { imageUrl }),
      userId,
    }).catch((err: Error) => {
      Logger.warn(`[PlantService] classify dispatch failed: ${err.message}`);
    });
    return { recordId: record.id, status: DiagnosticStatus.PENDING };
  }

  async diagnosePlant(
    userId: number,
    imageBuffer?: Buffer,
    imageMimeType?: string,
    imageUrl?: string
  ) {
    const record = await this.#diagnosticService.createRecord(
      userId,
      'diagnose'
    );
    const stored = await this.#storeOrRecord(
      record,
      imageBuffer,
      imageMimeType,
      imageUrl
    );

    dispatchMlAnalysis(this.#queue, {
      jobType: MlJobType.DIAGNOSE,
      recordId: record.id,
      storagePath: stored.storagePath,
      storageDisk: stored.storageDisk,
      imageMimeType: imageMimeType ?? 'image/jpeg',
      ...(imageUrl && { imageUrl }),
      userId,
    }).catch((err: Error) => {
      Logger.warn(`[PlantService] diagnose dispatch failed: ${err.message}`);
    });
    return { recordId: record.id, status: DiagnosticStatus.PENDING };
  }
}
