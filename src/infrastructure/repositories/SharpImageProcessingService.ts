/**
 * Infrastructure: Sharp Image Processing Service
 * Concrete implementation using Sharp library
 * Handles actual image processing operations
 */
import { ImageProcessingService } from '../../domain/repositories/ImageProcessingService';
import { ImageProcessingOptions } from '../../domain/entities/Image';
import sharp from 'sharp';

export class SharpImageProcessingService implements ImageProcessingService {
  async processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions
  ): Promise<void> {
    let image = sharp(inputPath);

    // Apply resize if dimensions are specified
    if (options.width || options.height) {
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
      });
    }

    // Apply grayscale
    if (options.grayscale) {
      image = image.grayscale();
    }

    // Apply blur
    if (options.blur) {
      image = image.blur(options.blur);
    }

    // Apply rotation
    if (options.rotate) {
      image = image.rotate(options.rotate);
    }

    // Set format and quality
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
          image = image.jpeg({ quality: options.quality || 80 });
          break;
        case 'png':
          image = image.png({ quality: options.quality || 80 });
          break;
        case 'webp':
          image = image.webp({ quality: options.quality || 80 });
          break;
      }
    }

    // Save processed image
    await image.toFile(outputPath);
  }

  async getImageMetadata(imagePath: string): Promise<{
    width: number;
    height: number;
    format: string;
  }> {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
    };
  }
}
