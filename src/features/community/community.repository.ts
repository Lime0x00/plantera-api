import { BaseRepository } from '#infrastructure/database/base-repository';
import type { PostWhereInput } from './community.types';
import {
  IPostRepository,
  PostCreateInput,
  PostUpdateInput,
  PostWhereUniqueInput,
} from './community.repository.interface';
import { Post } from './domain/community.model';

export class CommunityRepository
  extends BaseRepository<
    Post,
    PostWhereUniqueInput,
    PostWhereInput,
    PostCreateInput,
    PostUpdateInput
  >
  implements IPostRepository
{
  public constructor() {
    super(Post);
  }
}
