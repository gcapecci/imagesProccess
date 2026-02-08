/**
 * Use Case: Process Image
 * Handles image processing operations following business rules
 */
import { ImageProcessingOptions } from '../../domain/entities/Image';
import { ImageRepository } from '../../domain/repositories/ImageRepository';
import { ImageProcessingService } from '../../domain/repositories/ImageProcessingService';
import path from 'path';

export class ProcessImageUseCase {
  constructor(
    private imageRepository: ImageRepository,
    private processingService: ImageProcessingService
  ) {}

  async execute(
    imageId: string,
    options: ImageProcessingOptions
  ): Promise<string> {
    // Find the image
    const image = await this.imageRepository.findById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // Get input and output paths
    const inputPath = this.imageRepository.getImagePath(image.fileName);
    const outputFileName = `processed_${Date.now()}_${image.fileName}`;
    const outputPath = this.imageRepository.getImagePath(outputFileName);

    // Process the image
    await this.processingService.processImage(inputPath, outputPath, options);

    return outputFileName;
  }
}
