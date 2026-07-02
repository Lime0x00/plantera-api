import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '#common/types/generated/prisma';
import { Logger } from '#infrastructure/observability/logger';
import type { SeedOptions } from './main.seeder';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

interface PlantSeed {
  classifierName: string;
  commonName: string;
  scientificName: string;
  family: string;
  about: string;
  temperature: string;
  light: string;
  water: string;
  whereToGrow: string;
  toxicity: string;
  howToGrow: string;
  category: string;
  kingdom: string;
  order_: string;
  imageUrl: string;
  wateringFrequency: number | null;
  fertilizingFrequency: number | null;
}

interface DiseaseSeed {
  name: string;
  otherNames: string[];
  type: string;
  causes: string;
  symptoms: string;
  treatment?: Record<string, string[]>;
  description: string;
}

export async function seedCatalog(
  prisma: PrismaClient,
  options: SeedOptions = {}
): Promise<number[]> {
  const allPlants: PlantSeed[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'plants.json'), 'utf-8')
  );
  const allDiseases: DiseaseSeed[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'diseases.json'), 'utf-8')
  );

  const toPlant = allPlants.slice(0, options.plants ?? allPlants.length);
  const plantIds: number[] = [];
  for (const p of toPlant) {
    const { id } = await prisma.plant.upsert({
      where: { classifierName: p.classifierName },
      create: p as any,
      update: p as any,
    });
    plantIds.push(id);
  }
  Logger.info(`  → ${plantIds.length} plants`);

  const toDisease = allDiseases.slice(
    0,
    options.diseases ?? allDiseases.length
  );
  for (const d of toDisease) {
    await prisma.disease.upsert({
      where: { name: d.name },
      create: d as any,
      update: d as any,
    });
  }
  Logger.info(`  → ${toDisease.length} diseases`);

  return plantIds;
}
