import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or server
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/docintel_platform',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_docintel_enterprise_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  
  ai: {
    provider: (process.env.AI_PROVIDER || 'demo').toLowerCase() as 'gemini' | 'openai' | 'demo',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
  },
  
  storage: {
    provider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase() as 'local' | 's3',
    localDir: path.resolve(__dirname, '../../uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || '',
    },
  },
};
