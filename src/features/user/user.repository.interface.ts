import type {
  FindUniqueArgs,
  FindManyArgs,
  UpdateArgs,
} from '#common/types/database';
import { User } from './domain/user.model';

export interface UserWhereUniqueInput {
  id?: number;
  email?: string;
  userName?: string;
}

export interface UserCreateInput {
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  password?: string;
}

export interface UserUpdateInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  password?: string;
  timezone?: string | null;
  pushToken?: string | null;
  pushPlatform?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  storageDisk?: string | null;
  storagePath?: string | null;
}

export interface IUserRepository {
  create(args: { data: UserCreateInput }): Promise<User>;
  findUnique(args: FindUniqueArgs<UserWhereUniqueInput>): Promise<User | null>;
  findMany(args?: FindManyArgs<UserWhereUniqueInput>): Promise<User[]>;
  update(
    args: UpdateArgs<UserWhereUniqueInput, UserUpdateInput>
  ): Promise<User>;
  updateSilent(
    args: UpdateArgs<UserWhereUniqueInput, UserUpdateInput>
  ): Promise<User>;
  delete(args: { where: UserWhereUniqueInput }): Promise<User>;
}
