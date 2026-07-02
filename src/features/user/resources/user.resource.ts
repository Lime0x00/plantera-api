import { Resource } from '#common/types/http/resources';
import type { components } from '#common/types/generated/openapi.types';
import { User } from '../domain/user.model';

type SpecSchemas = components['schemas'];

export class UserResource extends Resource<User, SpecSchemas['User']> {
  protected transform(u: User): SpecSchemas['User'] {
    return {
      id: u.id!,
      firstName: u.firstName,
      lastName: u.lastName,
      userName: u.userName,
      email: u.email,
      avatar: u.resolveImageUrl() ?? (null as any),
    };
  }
}
