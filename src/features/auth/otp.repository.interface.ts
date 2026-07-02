import type { OtpModel } from './domain/otp.model';
import type { CreateArgs, UpdateArgs } from '#common/types';
import type { Prisma } from '#common/types/generated/prisma';

export interface IOtpRepository {
  create(args: CreateArgs<Prisma.OtpCreateInput>): Promise<OtpModel>;
  findValid(
    email: string,
    code: string,
    type: string
  ): Promise<OtpModel | null>;
  update(
    args: UpdateArgs<{ id?: number }, { usedAt?: Date }>
  ): Promise<OtpModel>;
}
