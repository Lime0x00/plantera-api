import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import type { IUploadedFile } from '#common/types/storage';
import type {
  IStorageDriver,
  UploadSignature,
} from '#infrastructure/storage/storage.interface';
import { config } from '#common/helpers';
import type { FilesystemConfig } from '#config/filesystem';

export class CloudinaryStorageDriver implements IStorageDriver {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    const cloudinaryConfig = config<FilesystemConfig['cloudinary']>(
      'filesystem.cloudinary'
    );
    this.cloudName = cloudinaryConfig.cloud_name;
    this.apiKey = cloudinaryConfig.api_key;
    this.apiSecret = cloudinaryConfig.api_secret;
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  public async put(filePath: string, file: IUploadedFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedPath = path.parse(filePath);
      const folder = parsedPath.dir;
      const publicId = parsedPath.name;

      const uploadOptions: Record<string, unknown> = {
        ...(folder ? { folder } : {}),
        public_id: publicId,
        overwrite: true,
        resource_type: 'auto',
      };

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(filePath);
          } else {
            reject(new Error('Cloudinary upload failed with empty result'));
          }
        }
      );
      stream.end(file.buffer);
    });
  }

  public async get(filePath: string): Promise<Buffer> {
    const parsedPath = path.parse(filePath);
    const folder = parsedPath.dir;
    const publicId = parsedPath.name;
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    const url = cloudinary.url(fullPublicId, { secure: true });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from Cloudinary: ${response.statusText}`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  public async delete(filePath: string): Promise<void> {
    const parsedPath = path.parse(filePath);
    const folder = parsedPath.dir;
    const publicId = parsedPath.name;
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(fullPublicId, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  public url(relativePath: string): string {
    return cloudinary.url(relativePath, { secure: true });
  }

  public createUploadPath(filePath: string): string {
    const parsedPath = path.parse(filePath);
    const folder = parsedPath.dir;
    const publicId = parsedPath.name;
    return folder ? `${folder}/${publicId}` : publicId;
  }

  public createUploadSignature(filePath: string): UploadSignature {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = path.dirname(filePath);
    const publicId = path.basename(filePath, path.extname(filePath));

    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
      overwrite: true,
      resource_type: 'auto',
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      fields: {
        timestamp: String(timestamp),
        folder,
        public_id: publicId,
        overwrite: 'true',
        resource_type: 'auto',
        signature,
        api_key: this.apiKey,
      },
      expiresAt: timestamp + 3600,
    };
  }
}
