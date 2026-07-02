import { faker } from '@faker-js/faker';

export interface MyPlantFactoryData {
  userId: number;
  plantId: number;
  wateringFrequency: number;
  fertilizingFrequency: number;
  storageDisk?: string | null;
  storagePath?: string | null;
  lastWatered?: Date;
  lastFertilized?: Date;
  nextWatering?: Date;
  nextFertilizing?: Date;
}

export function makeMyPlant(
  userId: number,
  plantId: number,
  data?: Partial<MyPlantFactoryData>
): MyPlantFactoryData {
  const watering =
    data?.wateringFrequency ?? faker.number.int({ min: 3, max: 21 });
  const fertilizing =
    data?.fertilizingFrequency ?? faker.number.int({ min: 14, max: 90 });
  const now = new Date();
  return {
    userId,
    plantId,
    wateringFrequency: watering,
    fertilizingFrequency: fertilizing,
    storageDisk: data?.storageDisk ?? null,
    storagePath: data?.storagePath ?? null,
    lastWatered: data?.lastWatered ?? faker.date.recent({ days: 7 }),
    lastFertilized: data?.lastFertilized ?? faker.date.recent({ days: 30 }),
    nextWatering:
      data?.nextWatering ?? new Date(now.getTime() + watering * 86400000),
    nextFertilizing:
      data?.nextFertilizing ?? new Date(now.getTime() + fertilizing * 86400000),
  };
}

export function makeMyPlants(
  userId: number,
  plantIds: number[]
): MyPlantFactoryData[] {
  return plantIds.map((plantId) => makeMyPlant(userId, plantId));
}
