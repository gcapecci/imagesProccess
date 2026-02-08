/**
 * Infrastructure: Express Server Configuration
 * Sets up the web server with middleware
 */
import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files (processed images)
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // Serve frontend
  app.use(express.static(path.join(process.cwd(), 'public')));

  return app;
}
