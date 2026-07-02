import { Resource } from '#common/types/http/resources';
import { Disease } from '#features/disease/domain';

export type DiseaseSchema = {
  id: number;
  name: string;
  otherNames: string[];
  type: string | null;
  causes: string | null;
  symptoms: string | null;
  treatment: { steps: string[] } | null;
  description: string | null;
  imageUrl: string | null;
};

export class DiseaseResource extends Resource<unknown, DiseaseSchema> {
  protected transform(d: unknown): DiseaseSchema {
    const dis = d as Record<string, unknown>;
    const treatment = dis.treatment as
      | Record<string, unknown>
      | null
      | undefined;

    let treatmentObj: { steps: string[] } | null = null;
    if (treatment && typeof treatment === 'object' && treatment !== null) {
      const steps = treatment.steps;
      if (Array.isArray(steps)) {
        treatmentObj = { steps: steps as string[] };
      }
    }

    return {
      id: dis.id as number,
      name: dis.name as string,
      otherNames: Disease.extractArray(dis.otherNames),
      type: (dis.type as string | null | undefined) ?? null,
      causes: (dis.causes as string | null | undefined) ?? null,
      symptoms: (dis.symptoms as string | null | undefined) ?? null,
      treatment: treatmentObj,
      description: (dis.description as string | null | undefined) ?? null,
      imageUrl: (dis.imageUrl as string | null | undefined) ?? null,
    };
  }
}
