import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import { config } from '../config';

const storage = multer.memoryStorage();

const allowedExtensions = [
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.csv',
  '.txt',
  '.md',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type "${ext}". Supported types are: ${allowedExtensions.join(', ')}`
      )
    );
  }
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxFileSizeMb * 1024 * 1024,
  },
});
