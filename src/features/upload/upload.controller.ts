import type { Request, Response, NextFunction } from 'express';
import { Controller } from '#framework/presentation/controller';
import { StorageService } from '#infrastructure/storage/storage.service';
import { StoragePathResolver } from '#infrastructure/storage/storage-path.resolver';
import { UserService } from '#features/user/user.service';
import { User } from '#features/user/domain/user.model';

interface UploadControllerDeps {
  storageService: StorageService;
  userService: UserService;
}

export class UploadController extends Controller {
  #storage: StorageService;
  #userService: UserService;

  constructor({ storageService, userService }: UploadControllerDeps) {
    super();
    this.#storage = storageService;
    this.#userService = userService;
  }

  public async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    return super.run(next, async () => {
      const file = req.file;
      if (!file) {
        return super.fail(res, 400, 'No file uploaded');
      }

      const userId = req.user!.userId;

      if (!file.mimetype.startsWith('image/')) {
        return super.fail(res, 400, 'Only image files are allowed');
      }

      const user = new User();
      user.id = userId;
      const ext = file.mimetype.split('/')[1] || 'jpg';
      const storagePath = StoragePathResolver.forModel(user, ext);

      const result = await this.#storage.upload(storagePath, {
        buffer: file.buffer,
        mimeType: file.mimetype,
        filename: file.originalname,
        size: file.size,
      });

      const updatedUser = await this.#userService.update(userId, {
        storageDisk: result.disk,
        storagePath: result.path,
      });

      return super.ok(
        res,
        {
          storageDisk: result.disk,
          storagePath: result.path,
          imageUrl: updatedUser.resolveImageUrl(),
        },
        'Avatar uploaded successfully'
      );
    });
  }
}
