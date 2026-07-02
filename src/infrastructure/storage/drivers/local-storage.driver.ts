import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { IUploadedFile } from '#common/types/storage';
import {
  IStorageDriver,
  UploadSignature,
} from '#infrastructure/storage/storage.interface';
import { config } from '#common/helpers';

export class LocalStorageDriver implements IStorageDriver {
  private publicDir = path.join(process.cwd(), 'public', 'uploads');
  private secret = config('app.key', 'dev-secret-key-change-in-production');

  constructor() {
    fs.mkdir(this.publicDir, { recursive: true }).catch(() => {});
  }

  public async put(filePath: string, file: IUploadedFile): Promise<string> {
    const fullPath = path.join(this.publicDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);
    return filePath;
  }

  public async get(filePath: string): Promise<Buffer> {
    return fs.readFile(path.join(this.publicDir, filePath));
  }

  public async delete(filePath: string): Promise<void> {
    await fs.unlink(path.join(this.publicDir, filePath)).catch(() => {});
  }

  public url(relativePath: string): string {
    return `${config('filesystem.url')}/uploads/${relativePath}`;
  }

  public createUploadPath(filePath: string): string {
    return filePath;
  }

  public createUploadSignature(filePath: string): UploadSignature {
    const timestamp = Math.round(Date.now() / 1000);
    const expiresAt = timestamp + 3600;

    const dataToSign = `${filePath}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(dataToSign)
      .digest('hex');

    const token = Buffer.from(
      JSON.stringify({ path: filePath, expiresAt, signature })
    ).toString('base64url');

    const baseUrl = config('app.frontend_url', 'http://localhost:8000');

    return {
      uploadUrl: `${baseUrl}/api/v1/upload/local`,
      fields: { token },
      expiresAt,
    };
  }
}
