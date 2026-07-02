import { Resource } from '#common/types/http/resources';
import type { components } from '#common/types/generated/openapi.types';
import { PlantResource } from '#features/plant/resources/plant.resource';
import { MyPlantModel } from '../domain/myPlant.model';

type SpecSchemas = components['schemas'];

export class MyPlantResource extends Resource<
  MyPlantModel,
  SpecSchemas['MyPlant']
> {
  #plantResource = new PlantResource();

  protected transform(m: MyPlantModel): SpecSchemas['MyPlant'] {
    return {
      id: m.id!,
      plant: m.plant ? this.#plantResource.make(m.plant) : ({} as any),
      imageUrl: m.resolveImageUrl(),
      wateringFrequency: m.wateringFrequency ?? null,
      fertilizingFrequency: m.fertilizingFrequency ?? null,
      nextWatering: m.nextWatering ? m.nextWatering.toISOString() : null,
      nextFertilizing: m.nextFertilizing
        ? m.nextFertilizing.toISOString()
        : null,
      lastWatered: m.lastWatered ? m.lastWatered.toISOString() : null,
      lastFertilized: m.lastFertilized ? m.lastFertilized.toISOString() : null,
      createdAt: m.createdAt
        ? m.createdAt.toISOString()
        : new Date().toISOString(),
    } as SpecSchemas['MyPlant'];
  }
}
