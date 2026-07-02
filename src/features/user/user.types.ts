export * from './dtos';

export type User = {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  role?: string;
};

export type UserWhereInput = Record<string, unknown>;
