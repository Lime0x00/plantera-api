import type {
  FindUniqueArgs,
  FindManyArgs,
  CreateArgs,
  UpdateArgs,
  DeleteArgs,
} from '#common/types/database';
import type { Post } from './domain';

export interface PostWhereUniqueInput {
  id?: number;
}

export interface PostCreateInput {
  title: string;
  content: string;
  category?: string;
  tags?: string;
  published?: boolean;
  authorId: number;
}

export interface PostUpdateInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string;
  published?: boolean;
}

export interface IPostRepository {
  create(args: CreateArgs<PostCreateInput>): Promise<Post>;
  findUnique(args: FindUniqueArgs<PostWhereUniqueInput>): Promise<Post | null>;
  findMany(args?: FindManyArgs<Record<string, unknown>>): Promise<Post[]>;
  update(
    args: UpdateArgs<PostWhereUniqueInput, PostUpdateInput>
  ): Promise<Post>;
  delete(args: DeleteArgs<PostWhereUniqueInput>): Promise<Post>;
  count(args?: { where?: { published?: boolean } }): Promise<number>;
  withoutTrashed(): this;
}
