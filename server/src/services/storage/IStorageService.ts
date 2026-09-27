import { Readable } from 'stream';

export interface StorageUploadResult {
  storageKey: string;
  storagePath: string;
  publicUrl: string;
}

export interface IStorageService {
  uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subfolder?: string
  ): Promise<StorageUploadResult>;

  getFileStream(storageKey: string): Promise<Readable>;
  
  getFileBuffer(storageKey: string): Promise<Buffer>;

  deleteFile(storageKey: string): Promise<boolean>;

  getLocalFilePath?(storageKey: string): string;
}
