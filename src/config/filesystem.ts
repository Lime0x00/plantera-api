import { env } from '#common/env';

export type FilesystemDriver = 'LOCAL' | 'CLOUDINARY';

export type FilesystemConfig = {
  driver: FilesystemDriver;
  url: string;
  local: {
    uploads_dir: string;
  };
  cloudinary: {
    cloud_name: string;
    api_key: string;
    api_secret: string;
  };
};

export const filesystemConfig: FilesystemConfig = {
  driver: env<FilesystemDriver>('FILE_SYSTEM_DISK', 'LOCAL'),

  url: env<string>('APP_URL', 'http://localhost:8000'),

  local: {
    uploads_dir: env<string>('UPLOAD_DIR', 'uploads'),
  },

  cloudinary: {
    cloud_name: env<string>('CLOUDINARY_CLOUD_NAME', ''),
    api_key: env<string>('CLOUDINARY_API_KEY', ''),
    api_secret: env<string>('CLOUDINARY_API_SECRET', ''),
  },
};
