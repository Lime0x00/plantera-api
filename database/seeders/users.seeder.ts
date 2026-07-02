import bcrypt from 'bcrypt';
import type { PrismaClient } from '#common/types/generated/prisma';
import { Logger } from '#infrastructure/observability/logger';
import {
  makeUsers,
  makeMyPlants,
  makeNotificationPreferences,
} from '#database/factories';
import type { SeedOptions } from './main.seeder';

export async function seedUsers(
  prisma: PrismaClient,
  plantIds: number[],
  options: SeedOptions = {}
): Promise<number[]> {
  const count = options.users ?? 0;
  if (count <= 0) return [];

  const hashed = await bcrypt.hash('password123', 6);
  const userIds: number[] = [];

  for (const data of makeUsers(count)) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: { ...data, password: hashed },
      update: { ...data, password: hashed },
    });
    userIds.push(user.id);
  }
  Logger.info(`  → ${userIds.length} users`);

  const perUser = options.myPlantsPerUser ?? 3;
  let myCount = 0;
  for (const userId of userIds) {
    const assigned = [...plantIds]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(perUser, plantIds.length));
    for (const mp of makeMyPlants(userId, assigned)) {
      const existing = await prisma.myPlant.findFirst({
        where: {
          userId: mp.userId,
          plantId: mp.plantId,
        },
      });

      if (!existing) {
        await prisma.myPlant.create({ data: mp });
        myCount++;
      }
    }
  }
  Logger.info(`  → ${myCount} myPlants`);

  for (const userId of userIds) {
    await prisma.notificationPreferences.upsert({
      where: { userId },
      create: makeNotificationPreferences(userId),
      update: {},
    });
  }
  Logger.info(`  → ${userIds.length} notification preferences`);

  return userIds;
}
