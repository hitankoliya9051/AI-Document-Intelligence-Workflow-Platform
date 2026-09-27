import { IStorageService } from './IStorageService';
import { LocalStorageService } from './LocalStorageService';
import { config } from '../../config';

let storageInstance: IStorageService | null = null;

export const getStorageService = (): IStorageService => {
  if (!storageInstance) {
    if (config.storage.provider === 'local') {
      storageInstance = new LocalStorageService();
    } else {
      // In production if S3 is requested, fallback or initialize S3 provider
      console.log(`Using LocalStorageService (fallback or default)`);
      storageInstance = new LocalStorageService();
    }
  }
  return storageInstance;
};

export * from './IStorageService';
export * from './LocalStorageService';
