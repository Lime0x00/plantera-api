import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '#common/types/generated/prisma';
import { Logger } from '#infrastructure/observability/logger';
import { seedCatalog } from './catalog.seeder';
import { seedUsers } from './users.seeder';

export interface SeedOptions {
  plants?: number;
  diseases?: number;
  users?: number;
  myPlantsPerUser?: number;
}

export async function mainSeeder(options: SeedOptions = {}): Promise<void> {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres@localhost:5432/depiplant',
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  Logger.info('Running mainSeeder...');

  const plantIds = await seedCatalog(prisma, options);
  const _userIds = await seedUsers(prisma, plantIds, options);

  await prisma.$disconnect();
  Logger.info('mainSeeder complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options: SeedOptions = {};
  const usersArg = process.argv.find((a) => a.startsWith('--users='));
  if (usersArg) options.users = parseInt(usersArg.split('=')[1], 10);

  mainSeeder(options).catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
