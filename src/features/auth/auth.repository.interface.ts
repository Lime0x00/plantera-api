import {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  UpdateArgs,
  DeleteArgs,
} from '#common/types/database';
import { Auth } from './domain';

export interface AuthWhereUniqueInput {
  id?: number;
  email?: string;
  userName?: string;
}

/**
 * Agnostic input for creating Auth.
 */
export interface AuthCreateInput {
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  password?: string;
}

/**
 * Agnostic input for updating Auth.
 */
export interface AuthUpdateInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  password?: string;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
}

/**
 * Agnostic interface for Auth storage.
 */
export interface IAuthRepository {
  create(args: CreateArgs<AuthCreateInput>): Promise<Auth>;
  findUnique(args: FindUniqueArgs<AuthWhereUniqueInput>): Promise<Auth | null>;
  findMany(args?: FindManyArgs<AuthWhereUniqueInput>): Promise<Auth[]>;
  update(
    args: UpdateArgs<AuthWhereUniqueInput, AuthUpdateInput>
  ): Promise<Auth>;
  delete(args: DeleteArgs<AuthWhereUniqueInput>): Promise<Auth>;
}
