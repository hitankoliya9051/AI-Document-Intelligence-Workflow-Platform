import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

const app = express();

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  })
);

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file uploads serving
app.use('/uploads', express.static(config.storage.localDir));

// Rate Limiting
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`  AI Document Intelligence Platform - Backend API  `);
      console.log(`  Port:        ${config.port}                      `);
      console.log(`  Environment: ${config.nodeEnv}                   `);
      console.log(`  AI Provider: ${config.ai.provider}               `);
      console.log(`  MongoDB:     Connected                           `);
      console.log(`====================================================`);
    });

    const shutdown = async () => {
      console.log('\nGracefully shutting down server...');
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
