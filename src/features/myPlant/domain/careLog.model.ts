import { BaseModel } from '#framework/domain/base-model';

export class CareLog extends BaseModel {
  static modelKey = 'careLog';

  userId?: number;
  myPlantId?: number;
  type?: string;
}
