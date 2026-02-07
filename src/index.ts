/**
 * Main Entry Point
 * Dependency Injection / Composition Root
 * Wires all layers together following Clean Architecture principles
 */
import { createServer } from './infrastructure/server';
import { createRouter } from './presentation/routes';
import { ImageController } from './presentation/controllers/ImageController';

// Infrastructure implementations
import { FileSystemImageRepository } from './infrastructure/repositories/FileSystemImageRepository';
import { SharpImageProcessingService } from './infrastructure/repositories/SharpImageProcessingService';

// Use cases
import { UploadImageUseCase } from './application/useCases/UploadImageUseCase';
import { ProcessImageUseCase } from './application/useCases/ProcessImageUseCase';
import { GetImageUseCase } from './application/useCases/GetImageUseCase';
import { ListImagesUseCase } from './application/useCases/ListImagesUseCase';
import { DeleteImageUseCase } from './application/useCases/DeleteImageUseCase';

// Initialize infrastructure layer (outermost layer)
const imageRepository = new FileSystemImageRepository('public/uploads');
const imageProcessingService = new SharpImageProcessingService();

// Initialize use cases (application layer - depends on domain interfaces)
const uploadImageUseCase = new UploadImageUseCase(imageRepository);
const processImageUseCase = new ProcessImageUseCase(
  imageRepository,
  imageProcessingService
);
const getImageUseCase = new GetImageUseCase(imageRepository);
const listImagesUseCase = new ListImagesUseCase(imageRepository);
const deleteImageUseCase = new DeleteImageUseCase(imageRepository);

// Initialize controller (presentation layer)
const imageController = new ImageController(
  uploadImageUseCase,
  processImageUseCase,
  getImageUseCase,
  listImagesUseCase,
  deleteImageUseCase
);

// Create and configure server
const app = createServer();
const router = createRouter(imageController);

// Mount API routes
app.use('/api', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Image Processing Service is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: public/uploads`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 Frontend: http://localhost:${PORT}`);
});
