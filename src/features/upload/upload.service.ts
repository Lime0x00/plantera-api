import { Logger } from '#infrastructure/observability/logger';
import { StorageFactory } from '#infrastructure/storage/storage.factory';

export interface GetUploadSignatureRequest {
  disk: 'CLOUDINARY' | 'LOCAL';
  path: string;
  extension?: string;
}

export interface UploadSignatureResponse {
  uploadUrl: string;
  storageDisk: string;
  storagePath: string;
  fields?: Record<string, string>;
  expiresAt: number;
}

export class UploadService {
  generateSignature(req: GetUploadSignatureRequest): UploadSignatureResponse {
    const { disk, path, extension } = req;
    const resolvedPath = extension ? `${path}.${extension}` : path;
    const driver = StorageFactory.disk(disk);
    const signature = driver.createUploadSignature(resolvedPath);

    Logger.info('[UploadService] Generated upload signature', {
      disk,
      path: resolvedPath,
    });

    return {
      uploadUrl: signature.uploadUrl,
      storageDisk: disk,
      storagePath: resolvedPath,
      fields: signature.fields,
      expiresAt: signature.expiresAt,
    };
  }
}
