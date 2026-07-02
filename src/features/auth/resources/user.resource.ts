import { Resource } from '#common/types/http/resources';
import type { components } from '#common/types/generated/openapi.types';
import { User } from '#features/user/domain/user.model';

type SpecSchemas = components['schemas'];

export class UserResource extends Resource<unknown, SpecSchemas['User']> {
  protected transform(u: unknown): SpecSchemas['User'] {
    const data = u as Record<string, unknown>;
    return {
      id: data.id as number,
      firstName: data.firstName as string,
      lastName: data.lastName as string,
      userName: data.userName as string,
      email: data.email as string,
      avatar: User.resolveAvatarFrom(data) ?? (null as any),
    };
  }
}
