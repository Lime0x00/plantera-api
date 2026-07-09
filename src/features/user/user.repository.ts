import { BaseRepository } from '#infrastructure/database/base-repository';
import type { UserWhereInput } from '#features/user/user.types';
import { User } from '#features/user/domain/user.model';
import type {
  IUserRepository,
  UserCreateInput,
  UserUpdateInput,
  UserWhereUniqueInput,
} from '#features/user/user.repository.interface';

export class UserRepository
  extends BaseRepository<
    User,
    UserWhereUniqueInput,
    UserWhereInput,
    UserCreateInput,
    UserUpdateInput
  >
  implements IUserRepository
{
  public constructor() {
    super(User);
  }

  public async findUser(args: {
    where: UserWhereUniqueInput;
  }): Promise<User | null> {
    return this.findUnique(args);
  }

  public async updateUser(args: {
    where: UserWhereUniqueInput;
    data: UserUpdateInput;
  }): Promise<User> {
    return this.update(args);
  }

  public async updateSilent(args: {
    where: UserWhereUniqueInput;
    data: UserUpdateInput;
  }): Promise<User> {
    return super.updateSilent(args);
  }
}
