/**
 * Presentation Layer: Routes
 * Defines API endpoints
 */
import { Router } from 'express';
import multer from 'multer';
import { ImageController } from './controllers/ImageController';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export function createRouter(imageController: ImageController): Router {
  const router = Router();

  // Upload image
  router.post('/upload', upload.single('image'), (req, res) =>
    imageController.uploadImage(req, res)
  );

  // Process image
  router.post('/process/:id', (req, res) =>
    imageController.processImage(req, res)
  );

  // Get image details
  router.get('/images/:id', (req, res) =>
    imageController.getImage(req, res)
  );

  // List all images
  router.get('/images', (req, res) =>
    imageController.listImages(req, res)
  );

  // Delete image
  router.delete('/images/:id', (req, res) =>
    imageController.deleteImage(req, res)
  );

  return router;
}
