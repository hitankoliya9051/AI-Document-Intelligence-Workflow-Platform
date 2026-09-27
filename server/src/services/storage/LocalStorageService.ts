import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageService, StorageUploadResult } from './IStorageService';
import { config } from '../../config';

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = config.storage.localDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    subfolder: string = ''
  ): Promise<StorageUploadResult> {
    const targetDir = subfolder ? path.join(this.baseDir, subfolder) : this.baseDir;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(originalName) || '';
    const uniqueId = crypto.randomUUID();
    const safeBaseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const fileName = `${Date.now()}-${uniqueId.substring(0, 8)}-${safeBaseName}${ext}`;
    
    const filePath = path.join(targetDir, fileName);
    await fs.promises.writeFile(filePath, fileBuffer);

    const relativeKey = subfolder ? path.join(subfolder, fileName).replace(/\\/g, '/') : fileName;

    return {
      storageKey: relativeKey,
      storagePath: filePath,
      publicUrl: `/uploads/${relativeKey}`,
    };
  }

  async getFileStream(storageKey: string): Promise<Readable> {
    const filePath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return fs.createReadStream(filePath);
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const filePath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return fs.promises.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting local file:', err);
      return false;
    }
  }

  getLocalFilePath(storageKey: string): string {
    return path.join(this.baseDir, storageKey);
  }
}
