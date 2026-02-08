/**
 * Domain Interface: Image Processing Service
 * Defines the contract for image processing operations
 * Following Dependency Inversion Principle
 */
import { ImageProcessingOptions } from '../entities/Image';

export interface ImageProcessingService {
  processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions
  ): Promise<void>;
  
  getImageMetadata(imagePath: string): Promise<{
    width: number;
    height: number;
    format: string;
  }>;
}
