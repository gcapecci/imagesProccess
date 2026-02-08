/**
 * Use Case: Upload Image
 * Application layer - orchestrates domain operations
 * Independent of infrastructure details
 */
import { Image } from '../../domain/entities/Image';
import { ImageRepository } from '../../domain/repositories/ImageRepository';

export class UploadImageUseCase {
  constructor(private imageRepository: ImageRepository) {}

  async execute(file: Express.Multer.File): Promise<Image> {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Save image using repository
    return await this.imageRepository.save(file);
  }
}
