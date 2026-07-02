export * from './dtos';

export type MyPlantWhereInput = Record<string, unknown>;

export type AddToMyPlantsRequest = {
  plantId: number;
};

export type UpdateSchedulePayload = {
  wateringFrequency?: number | null;
  fertilizingFrequency?: number | null;
};
