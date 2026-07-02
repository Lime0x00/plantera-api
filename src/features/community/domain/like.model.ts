import { BaseModel } from '#framework/domain/base-model';

export class LikeModel extends BaseModel {
  static modelKey = 'like';

  id!: number;
  postId!: number;
  authorId!: number;
  createdAt?: Date;
  deletedAt?: Date | null;
}
