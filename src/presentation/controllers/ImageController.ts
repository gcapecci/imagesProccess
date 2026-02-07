/**
 * Presentation Layer: Image Controller
 * Handles HTTP requests and responses
 * Delegates business logic to use cases
 */
import { Request, Response } from 'express';
import { UploadImageUseCase } from '../../application/useCases/UploadImageUseCase';
import { ProcessImageUseCase } from '../../application/useCases/ProcessImageUseCase';
import { GetImageUseCase } from '../../application/useCases/GetImageUseCase';
import { ListImagesUseCase } from '../../application/useCases/ListImagesUseCase';
import { DeleteImageUseCase } from '../../application/useCases/DeleteImageUseCase';

export class ImageController {
  constructor(
    private uploadImageUseCase: UploadImageUseCase,
    private processImageUseCase: ProcessImageUseCase,
    private getImageUseCase: GetImageUseCase,
    private listImagesUseCase: ListImagesUseCase,
    private deleteImageUseCase: DeleteImageUseCase
  ) {}

  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const image = await this.uploadImageUseCase.execute(req.file);
      res.status(201).json({
        message: 'Image uploaded successfully',
        image,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }

  async processImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const options = req.body;

      const processedFileName = await this.processImageUseCase.execute(
        id as string,
        options
      );
      res.json({
        message: 'Image processed successfully',
        processedFileName,
        downloadUrl: `/uploads/${processedFileName}`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Processing failed',
      });
    }
  }

  async getImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const image = await this.getImageUseCase.execute(id as string);

      if (!image) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      res.json({ image });
    } catch (error) {
      console.error('Get image error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to retrieve image',
      });
    }
  }

  async listImages(req: Request, res: Response): Promise<void> {
    try {
      const images = await this.listImagesUseCase.execute();
      res.json({ images });
    } catch (error) {
      console.error('List images error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list images',
      });
    }
  }

  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.deleteImageUseCase.execute(id as string);

      if (!deleted) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete image',
      });
    }
  }
}
