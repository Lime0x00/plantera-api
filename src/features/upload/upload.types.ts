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

export interface ConfirmUploadRequest {
  storageDisk: string;
  storagePath: string;
}
