import { IUploadedFile } from '#common/types/storage/storage.types';

export interface UploadSignature {
  uploadUrl: string;
  fields: Record<string, string>;
  expiresAt: number;
}

export interface IStorageDriver {
  put(path: string, file: IUploadedFile): Promise<string>;
  get(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  url(path: string): string;
  createUploadSignature(path: string): UploadSignature;
  createUploadPath(path: string): string;
}
