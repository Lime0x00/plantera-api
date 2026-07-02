export interface IUploadedFile {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}
