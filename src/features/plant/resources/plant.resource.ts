import { Resource } from '#common/types/http/resources';
import type { components } from '#common/types/generated/openapi.types';
import { Plant } from '../domain/plant.model';

type SpecSchemas = components['schemas'];

export class PlantResource extends Resource<Plant, SpecSchemas['Plant']> {
  protected transform(pl: Plant): SpecSchemas['Plant'] {
    return {
      id: pl.id,
      commonName: pl.commonName ?? '',
      scientificName: pl.scientificName ?? '',
      family: pl.family ?? '',
      about: pl.about ?? '',
      temperature: pl.temperature ?? '',
      light: pl.light ?? '',
      water: pl.water ?? '',
      whereToGrow: pl.whereToGrow ?? '',
      toxicity: pl.toxicity ?? '',
      howToGrow: pl.howToGrow ?? '',
      category: pl.category
        ? pl.category
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean)
        : [],
      kingdom: pl.kingdom ?? '',
      order: pl.order_ ?? '',
      imageUrl: pl.imageUrl ?? '',
      wateringFrequency: pl.wateringFrequency as number,
      fertilizingFrequency: pl.fertilizingFrequency as number,
    };
  }
}
