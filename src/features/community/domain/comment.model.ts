import { BaseModel } from '#framework/domain/base-model';

export class CommentModel extends BaseModel {
  static modelKey = 'comment';

  id!: number;
  content!: string;
  postId!: number;
  authorId!: number;
}
