import { BaseRepository } from '#infrastructure/database/base-repository';

import {
  IAuthRepository,
  AuthCreateInput,
  AuthUpdateInput,
  AuthWhereUniqueInput,
} from '#features/auth/auth.repository.interface';

import { Auth } from '#features/auth/domain';

export class AuthRepository
  extends BaseRepository<
    Auth,
    AuthWhereUniqueInput,
    import('#features/auth/auth.types').AuthWhereInput,
    AuthCreateInput,
    AuthUpdateInput
  >
  implements IAuthRepository
{
  public constructor() {
    super(Auth);
  }
}
