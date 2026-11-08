/**
 * PhoneGuard API - Express Application Factory
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

export function createApp() {
  const app = express();

  // Disable 'X-Powered-By' header for security
  app.disable('x-powered-by');

  // Trust proxy for RapidAPI / reverse proxies
  app.set('trust proxy', 1);

  // Helmet with Content Security Policy tuned for Tailwind CDN and Google Fonts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS - allow RapidAPI and cross-origin consumer requests
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-RapidAPI-Key', 'X-RapidAPI-Host', 'X-RapidAPI-Proxy-Secret']
    })
  );

  // Body parsers
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Static files from public directory without hijacking root /
  app.use(express.static(path.join(projectRoot, 'public'), { index: false }));

  // Application routes
  app.use(routes);

  // 404 handler for unknown routes
  app.use(notFoundHandler);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
