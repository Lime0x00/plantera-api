import { ConflictError, NotFoundError, ValidationError } from '#common/errors';
import { config, paginate, offset } from '#common/helpers';
import { PlantService } from '#features/plant';
import { DiagnosticService } from '#features/diagnostic';
import { DiagnosticStatus } from '#features/diagnostic/diagnostic.types';
import type { IDiagnosticRepository } from '#features/diagnostic/diagnostic.repository.interface';
import {
  StorageService,
  type StoredFile,
} from '#infrastructure/storage/storage.service';
import { StoragePathResolver } from '#infrastructure/storage/storage-path.resolver';
import { QueueService } from '#infrastructure/queue/queue.service';
import { Logger } from '#infrastructure/observability/logger';
import { MlClient } from '#infrastructure/plant-analyzer-client';
import {
  dispatchMlAnalysis,
  MlJobType,
} from '#features/plant/jobs/ml-analysis.job';
import type { MyPlantUpdateInput } from './myPlant.repository.interface';
import { IMyPlantRepository } from './myPlant.repository.interface';
import { ICareLogRepository } from './careLog.repository.interface';
import { MyPlantErrors } from './myPlant.errors';
import { MyPlantModel } from './domain/myPlant.model';

export const IDENTIFY_CONFIDENCE_THRESHOLD = 0.7;

interface MyPlantServiceDeps {
  myPlantRepository: IMyPlantRepository;
  careLogRepository: ICareLogRepository;
  plantService: PlantService;
  diagnosticService: DiagnosticService;
  diagnosticRepository: IDiagnosticRepository;
  storageService: StorageService;
  queueService: QueueService;
  mlClient: MlClient;
}

export class MyPlantService {
  #repository: IMyPlantRepository;
  #careLogRepository: ICareLogRepository;
  #plantService: PlantService;
  #diagnosticService: DiagnosticService;
  #diagnosticRepository: IDiagnosticRepository;
  #storage: StorageService;
  #queue: QueueService;
  #mlClient: MlClient;

  constructor({
    myPlantRepository,
    careLogRepository,
    plantService,
    diagnosticService,
    diagnosticRepository,
    storageService,
    queueService,
    mlClient,
  }: MyPlantServiceDeps) {
    this.#repository = myPlantRepository;
    this.#careLogRepository = careLogRepository;
    this.#plantService = plantService;
    this.#diagnosticService = diagnosticService;
    this.#diagnosticRepository = diagnosticRepository;
    this.#storage = storageService;
    this.#queue = queueService;
    this.#mlClient = mlClient;
  }

  async #logCare(
    userId: number,
    myPlantId: number,
    type: 'watering' | 'fertilizing'
  ) {
    return this.#careLogRepository.create({
      data: { userId, myPlantId, type },
    });
  }

  async #uploadImage(
    myPlant: MyPlantModel,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<StoredFile> {
    const ext = mimeType.split('/')[1] || 'jpg';
    return this.#storage.upload(StoragePathResolver.forModel(myPlant, ext), {
      filename: `plant.${ext}`,
      buffer: imageBuffer,
      mimeType,
      size: imageBuffer.length,
    });
  }

  public async listMyPlants(userId: number, page: number, limit: number) {
    const skip = offset(page, limit);
    const [data, totalCount] = await Promise.all([
      this.#repository.findMany({
        where: { userId },
        include: { plant: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.#repository.count({ where: { userId } }),
    ]);
    return { data, meta: paginate(totalCount, page, limit) };
  }

  public async addToMyPlants(
    userId: number,
    plantId: number,
    stored?: StoredFile | null
  ) {
    const { plant } = await this.#plantService.getPlantById(plantId);

    const existingTrashed = await this.#repository.withTrashed().findMany({
      where: { userId, plantId },
    });
    this.#repository.withoutTrashed();

    if (existingTrashed.length > 0) {
      const existing = existingTrashed[0];
      if (!existing.isTrashed()) {
        throw new ConflictError(MyPlantErrors.ALREADY_EXISTS, {
          plantId: {
            code: 'CONFLICT',
            message: 'This plant is already in your garden collection.',
          },
        });
      }

      const wf = plant.wateringFrequency ?? null;
      const ff = plant.fertilizingFrequency ?? null;

      await this.#repository.restore({
        where: { id: existing.id },
      });

      const updated = await this.#repository.update({
        where: { id: existing.id },
        data: {
          storageDisk: stored?.disk ?? null,
          storagePath: stored?.path ?? null,
          wateringFrequency: wf,
          fertilizingFrequency: ff,
          nextWatering: MyPlantModel.calculateNextDate(wf),
          nextFertilizing: MyPlantModel.calculateNextDate(ff),
        },
        include: { plant: true },
      });

      return { myPlant: updated };
    }

    const wf = plant.wateringFrequency ?? null;
    const ff = plant.fertilizingFrequency ?? null;

    return {
      myPlant: await this.#repository.create({
        data: {
          userId,
          plantId,
          storageDisk: stored?.disk ?? null,
          storagePath: stored?.path ?? null,
          wateringFrequency: wf,
          fertilizingFrequency: ff,
          nextWatering: MyPlantModel.calculateNextDate(wf),
          nextFertilizing: MyPlantModel.calculateNextDate(ff),
        },
        include: { plant: true },
      }),
    };
  }

  public async removeFromMyPlants(userId: number, myPlantId: number) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }
    await this.#repository.delete({ where: { id: myPlantId } });
  }


  public async water(userId: number, myPlantId: number) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }

    const now = new Date();
    const freq = existing.wateringFrequency;
    const updateData: MyPlantUpdateInput = {
      lastWatered: now,
      nextWatering: MyPlantModel.calculateNextDate(freq, now),
    };

    const [myPlant] = await Promise.all([
      this.#repository.update({
        where: { id: myPlantId },
        data: updateData,
        include: { plant: true },
      }),
      this.#logCare(userId, myPlantId, 'watering'),
    ]);

    return { myPlant };
  }

  public async fertilize(userId: number, myPlantId: number) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }

    const now = new Date();
    const freq = existing.fertilizingFrequency;
    const updateData: MyPlantUpdateInput = {
      lastFertilized: now,
      nextFertilizing: MyPlantModel.calculateNextDate(freq, now),
    };

    const [myPlant] = await Promise.all([
      this.#repository.update({
        where: { id: myPlantId },
        data: updateData,
        include: { plant: true },
      }),
      this.#logCare(userId, myPlantId, 'fertilizing'),
    ]);

    return { myPlant };
  }

  public async upcomingCare(userId: number) {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 86400000);

    const all = await this.#repository.findMany({
      where: {
        userId,
        OR: [
          { nextWatering: { gte: now, lte: sevenDays } },
          { nextFertilizing: { gte: now, lte: sevenDays } },
        ],
      },
      include: { plant: true },
      orderBy: [{ nextWatering: 'asc' }, { nextFertilizing: 'asc' }],
    });

    return { data: all };
  }

  public async calendarCare(userId: number) {
    const all = await this.#repository.findMany({
      where: {
        userId,
      },
      include: { plant: true },
      orderBy: [{ nextWatering: 'asc' }, { nextFertilizing: 'asc' }],
    });

    return { data: all };
  }

  public async careEvents(userId: number) {
    const now = new Date();
    const threeMonths = new Date(now.getTime() + 90 * 86400000);

    const [all, careLogs] = await Promise.all([
      this.#repository.findMany({
        where: { userId },
        include: { plant: true },
      }),
      this.#careLogRepository.findMany({
        where: { userId },
      }),
    ]);

    const logMap = new Map<string, string>();
    for (const log of careLogs) {
      const key = `${log.myPlantId}:${log.type}`;
      const existing = logMap.get(key);
      if (!existing || (log.createdAt && log.createdAt > new Date(existing))) {
        logMap.set(key, log.createdAt!.toISOString());
      }
    }

    const events: Array<{
      myPlantId: number;
      type: 'watering' | 'fertilizing';
      title: string;
      plantName: string;
      dueDate: string;
      status: 'overdue' | 'today' | 'upcoming';
      completed: boolean;
      completedAt: string | null;
    }> = [];

    const todayStr = now.toISOString().slice(0, 10);

    for (const mp of all) {
      const plantName = (mp.plant as { name?: string } | null)?.name ?? 'Plant';

      if (mp.nextWatering && mp.nextWatering <= threeMonths) {
        const dueDate = mp.nextWatering.toISOString();
        const dueStr = new Date(dueDate).toISOString().slice(0, 10);
        const completedAt = logMap.get(`${mp.id}:watering`) ?? null;
        const completed = !!completedAt;

        let status: 'overdue' | 'today' | 'upcoming';
        if (completed) status = 'upcoming';
        else if (mp.nextWatering < now) status = 'overdue';
        else if (dueStr === todayStr) status = 'today';
        else status = 'upcoming';

        events.push({
          myPlantId: mp.id!,
          type: 'watering',
          title: `Water ${plantName}`,
          plantName,
          dueDate,
          status,
          completed,
          completedAt,
        });
      }

      if (mp.nextFertilizing && mp.nextFertilizing <= threeMonths) {
        const dueDate = mp.nextFertilizing.toISOString();
        const dueStr = new Date(dueDate).toISOString().slice(0, 10);
        const completedAt = logMap.get(`${mp.id}:fertilizing`) ?? null;
        const completed = !!completedAt;

        let status: 'overdue' | 'today' | 'upcoming';
        if (completed) status = 'upcoming';
        else if (mp.nextFertilizing < now) status = 'overdue';
        else if (dueStr === todayStr) status = 'today';
        else status = 'upcoming';

        events.push({
          myPlantId: mp.id!,
          type: 'fertilizing',
          title: `Fertilize ${plantName}`,
          plantName,
          dueDate,
          status,
          completed,
          completedAt,
        });
      }
    }

    events.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return { data: events };
  }

  public async markCareComplete(
    userId: number,
    myPlantId: number,
    type: 'watering' | 'fertilizing'
  ) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }

    const now = new Date();
    const updateData: MyPlantUpdateInput = {};
    const careType = type;

    if (type === 'watering') {
      const freq = existing.wateringFrequency;
      updateData.lastWatered = now;
      updateData.nextWatering = MyPlantModel.calculateNextDate(freq, now);
    } else {
      const freq = existing.fertilizingFrequency;
      updateData.lastFertilized = now;
      updateData.nextFertilizing = MyPlantModel.calculateNextDate(freq, now);
    }

    const [myPlant] = await Promise.all([
      this.#repository.update({
        where: { id: myPlantId },
        data: updateData,
        include: { plant: true },
      }),
      this.#logCare(userId, myPlantId, careType),
    ]);

    return { myPlant };
  }

  public async identifyPlant(
    userId: number,
    imageBuffer?: Buffer,
    mimeType?: string,
    imageUrl?: string
  ) {
    const record = await this.#diagnosticService.createRecord(
      userId,
      'classify'
    );

    let storedFile: StoredFile | undefined;
    let storedImageUrl: string;
    let mlBuffer: Buffer;
    let mlMimeType: string;

    if (imageBuffer && mimeType) {
      mlBuffer = imageBuffer;
      mlMimeType = mimeType;
      const ext = mimeType.split('/')[1] || 'jpg';
      storedFile = await this.#storage.upload(
        StoragePathResolver.forModel(record, ext),
        {
          filename: `upload.${ext}`,
          buffer: imageBuffer,
          mimeType,
          size: imageBuffer.length,
        }
      );
      storedImageUrl = this.#storage.resolve(storedFile);
    } else if (imageUrl) {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      mlBuffer = Buffer.from(arrayBuffer);
      mlMimeType = response.headers.get('content-type') || 'image/jpeg';
      const ext = mlMimeType.split('/')[1] || 'jpg';
      storedFile = await this.#storage.upload(
        StoragePathResolver.forModel(record, ext),
        {
          filename: `upload.${ext}`,
          buffer: mlBuffer,
          mimeType: mlMimeType,
          size: mlBuffer.length,
        }
      );
      storedImageUrl = this.#storage.resolve(storedFile);
    } else {
      throw new Error('Either an image file or imageUrl is required.');
    }

    await this.#diagnosticService.updateRecordStatus(
      record.id,
      DiagnosticStatus.PROCESSING
    );

    let mlResult: {
      data?: Array<{
        class_name: string;
        class_id: number;
        confidence: number;
      }>;
    };
    try {
      mlResult = await this.#mlClient.classify(mlBuffer, mlMimeType);
    } catch (err) {
      await this.#diagnosticService.updateRecordStatus(
        record.id,
        DiagnosticStatus.FAILED,
        {
          error: (err as Error).message,
        }
      );
      throw err;
    }

    const predictions = mlResult.data || [];
    const enriched = await Promise.all(
      predictions.map(async (p) => {
        const plants = await this.#plantService.findByClassifierName(
          p.class_name
        );
        return {
          classId: p.class_id,
          className: p.class_name,
          confidence: p.confidence,
          plantId: plants[0]?.id ?? null,
          plant: plants[0] ?? null,
        };
      })
    );

    const threshold = config<number>(
      'ml.identifyThreshold',
      IDENTIFY_CONFIDENCE_THRESHOLD
    );
    const confident = enriched.filter(
      (p) => p.confidence >= threshold && p.plantId != null
    );
    const suggestions = confident.map((p) => ({
      classId: p.classId,
      className: p.className,
      confidence: p.confidence,
      plantId: p.plantId!,
      plantName: p.plant?.commonName ?? p.className,
      imageUrl: p.plant?.imageUrl ?? null,
    }));

    if (suggestions.length === 0) {
      await this.#diagnosticRepository.update({
        where: { id: record.id },
        data: { storageDisk: storedFile!.disk, storagePath: storedFile!.path },
      });
      await this.#diagnosticService.updateRecordStatus(
        record.id,
        DiagnosticStatus.COMPLETED,
        {
          result: {
            predictions: enriched,
            imageUrl: storedImageUrl,
            status: 'cannot_identify',
          },
        }
      );
      return {
        recordId: record.id,
        status: 'cannot_identify',
        imageUrl: storedImageUrl,
        suggestions: enriched.slice(0, 5).map((p) => ({
          classId: p.classId,
          className: p.className,
          confidence: p.confidence,
          plantId: p.plantId,
          plantName: p.plant?.commonName ?? p.className,
          imageUrl: p.plant?.imageUrl ?? null,
        })),
      };
    }

    if (suggestions.length === 1) {
      const chosen = suggestions[0];
      const { myPlant } = await this.addToMyPlants(
        userId,
        chosen.plantId,
        storedFile
      );
      await this.#diagnosticRepository.update({
        where: { id: record.id },
        data: {
          plantId: chosen.plantId,
          myPlantId: myPlant.id!,
          status: DiagnosticStatus.COMPLETED,
          storageDisk: storedFile!.disk,
          storagePath: storedFile!.path,
        },
      });
      await this.#diagnosticService.updateRecordStatus(
        record.id,
        DiagnosticStatus.COMPLETED,
        {
          result: {
            predictions: enriched,
            imageUrl: storedImageUrl,
            status: 'identified',
            plantId: chosen.plantId,
          },
        }
      );
      return {
        recordId: record.id,
        status: 'identified',
        myPlant,
        imageUrl: storedImageUrl,
        suggestions: [],
      };
    }

    await this.#diagnosticRepository.update({
      where: { id: record.id },
      data: { storageDisk: storedFile!.disk, storagePath: storedFile!.path },
    });
    await this.#diagnosticService.updateRecordStatus(
      record.id,
      DiagnosticStatus.COMPLETED,
      {
        result: {
          predictions: enriched,
          imageUrl: storedImageUrl,
          status: 'suggestions',
        },
      }
    );
    return {
      recordId: record.id,
      status: 'suggestions',
      imageUrl: storedImageUrl,
      suggestions,
    };
  }

  public async confirmIdentify(
    userId: number,
    recordId: number,
    predictionIndex: number
  ) {
    const record = await this.#diagnosticService.getRecord(userId, recordId);
    if (record.status !== DiagnosticStatus.COMPLETED) {
      throw new ValidationError('Classification is not yet complete.');
    }

    if (record.myPlantId) {
      throw new ConflictError(
        'This classification has already been confirmed.'
      );
    }

    const result = record.result as {
      predictions?: Array<{
        classId: string;
        className: string;
        confidence: number;
        plantId: number | null;
      }>;
    } | null;

    if (!result?.predictions?.length) {
      throw new NotFoundError('No predictions found.');
    }

    if (predictionIndex < 0 || predictionIndex >= result.predictions.length) {
      throw new ValidationError('Invalid prediction index.');
    }

    const prediction = result.predictions[predictionIndex];
    if (!prediction.plantId) {
      throw new NotFoundError(
        'No matching plant in catalog for this prediction.'
      );
    }

    const stored =
      record.storageDisk && record.storagePath
        ? { disk: record.storageDisk, path: record.storagePath }
        : undefined;
    const { myPlant } = await this.addToMyPlants(
      userId,
      prediction.plantId,
      stored
    );
    await this.#diagnosticRepository.update({
      where: { id: recordId },
      data: { plantId: prediction.plantId, myPlantId: myPlant.id! },
    });

    return { myPlant, prediction };
  }

  public async diagnoseMyPlant(
    userId: number,
    myPlantId: number,
    imageBuffer?: Buffer,
    mimeType?: string,
    imageUrl?: string
  ) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }

    let imageUrl_: string;
    let stored: StoredFile | undefined;

    if (imageBuffer && mimeType) {
      stored = await this.#uploadImage(existing, imageBuffer, mimeType);
      imageUrl_ = this.#storage.resolve(stored);
      await this.#repository.update({
        where: { id: myPlantId },
        data: { storageDisk: stored.disk, storagePath: stored.path },
      });
    } else if (imageUrl) {
      imageUrl_ = imageUrl;
    } else if (existing.resolveImageUrl()) {
      imageUrl_ = existing.resolveImageUrl()!;
    } else {
      throw new ValidationError(
        'No image available for diagnosis. Please upload a plant photo.'
      );
    }

    const record = await this.#diagnosticService.createRecord(
      userId,
      'diagnose',
      DiagnosticStatus.PENDING,
      null,
      myPlantId
    );

    await this.#diagnosticRepository.update({
      where: { id: record.id },
      data: {
        storageDisk: stored?.disk ?? null,
        storagePath: stored?.path ?? null,
      },
    });

    dispatchMlAnalysis(this.#queue, {
      jobType: MlJobType.DIAGNOSE,
      recordId: record.id,
      storagePath: stored?.path ?? '',
      storageDisk: stored?.disk ?? '',
      imageMimeType: mimeType ?? 'image/jpeg',
      ...(imageUrl && { imageUrl }),
      userId,
    }).catch((err: Error) => {
      Logger.warn(`[MyPlantService] diagnose dispatch failed: ${err.message}`);
    });

    return { recordId: record.id, status: DiagnosticStatus.PENDING };
  }

  public async getDiagnoses(
    userId: number,
    myPlantId: number,
    page: number,
    limit: number
  ) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }

    const skip = offset(page, limit);
    const [records, totalCount] = await Promise.all([
      this.#diagnosticRepository.findMany({
        where: { userId, myPlantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.#diagnosticRepository.count({ where: { userId, myPlantId } }),
    ]);

    return { records, ...paginate(totalCount, page, limit) };
  }

  public async updateImage(
    userId: number,
    myPlantId: number,
    imageBuffer: Buffer,
    mimeType: string
  ) {
    const existing = await this.#repository.findUnique({
      where: { id: myPlantId },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError(MyPlantErrors.NOT_FOUND);
    }

    const stored = await this.#uploadImage(existing, imageBuffer, mimeType);

    return {
      myPlant: await this.#repository.update({
        where: { id: myPlantId },
        data: { storageDisk: stored.disk, storagePath: stored.path },
        include: { plant: true },
      }),
    };
  }

  public async getCareLogs(
    userId: number,
    myPlantId?: number,
    page: number = 1,
    limit: number = 20
  ) {
    const where: Record<string, unknown> = { userId };
    if (myPlantId) {
      where.myPlantId = myPlantId;
    }

    const skip = offset(page, limit);
    const [data, totalCount] = await Promise.all([
      this.#careLogRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.#careLogRepository.count({ where }),
    ]);

    return { data, meta: paginate(totalCount, page, limit) };
  }
}
