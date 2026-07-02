import { BaseRepository } from '#infrastructure/database/base-repository';
import { OtpModel } from './domain/otp.model';
import type { IOtpRepository } from './otp.repository.interface';
import type { Prisma } from '#common/types/generated/prisma';

interface OtpWhereUnique {
  id?: number;
}
interface OtpWhereMany {
  email?: string;
  code?: string;
  type?: string;
  usedAt?: Date | null;
  expiresAt?: { gt: Date };
}

export class OtpRepository
  extends BaseRepository<
    OtpModel,
    OtpWhereUnique,
    OtpWhereMany,
    Prisma.OtpCreateInput,
    { usedAt?: Date }
  >
  implements IOtpRepository
{
  constructor() {
    super(OtpModel);
  }

  async findValid(
    email: string,
    code: string,
    type: string
  ): Promise<OtpModel | null> {
    const items = await super.findMany({
      where: { email, code, type, usedAt: null, expiresAt: { gt: new Date() } },
    });

    return items[0] ?? null;
  }
}
