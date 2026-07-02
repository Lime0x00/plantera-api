export interface ImageStorable {
  id?: number;
  storageDisk?: string | null;
  storagePath?: string | null;

  /** Directory prefix for storage (e.g. 'plants', 'users/avatars') */
  storageDir(): string;

  /** Virtual storage path (without extension) — used for upload path generation */
  storageVirtualPath(): string;

  /** Resolve the public URL for this image using the configured storage driver */
  resolveImageUrl(): string | null;
}

export interface SoftDeletable {
  deletedAt?: Date | null;

  isTrashed(): boolean;

  restore(): void;
}

export interface Timestampable {
  createdAt: Date;
  updatedAt: Date;
}
