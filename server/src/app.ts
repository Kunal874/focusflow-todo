import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import type {AppConfig} from './config.js';
import {authRoutes} from './auth/routes.js';
import {taskRoutes} from './tasks/routes.js';
import {ApiError, errorHandler} from './middleware/errorHandler.js';

export function createApp(config: AppConfig) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use(express.json({limit: '32kb'}));
  app.get('/api/health', async (_req, res) => {
    try {
      if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) throw new Error('Offline');
      await mongoose.connection.db.admin().ping();
      res.json({status: 'ok', database: 'connected'});
    } catch {
      res.status(503).json({error: {code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.'}});
    }
  });
  app.use('/api/auth', authRoutes(config));
  app.use('/api/tasks', taskRoutes(config));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'This resource was not found.')));
  app.use(errorHandler);
  return app;
}
