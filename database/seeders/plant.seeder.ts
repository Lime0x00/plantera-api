import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '#common/types/generated/prisma';
import { Logger } from '#infrastructure/observability/logger';
import { seedCatalog } from './catalog.seeder';

async function plantSeeder(): Promise<void> {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres@localhost:5432/depiplant',
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  Logger.info('Running plantSeeder...');
  await seedCatalog(prisma);
  await prisma.$disconnect();
  Logger.info('plantSeeder complete.');
}

plantSeeder().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
