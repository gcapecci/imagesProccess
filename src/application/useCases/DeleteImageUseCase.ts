/**
 * Use Case: Delete Image
 * Removes an image from the system
 */
import { ImageRepository } from '../../domain/repositories/ImageRepository';

export class DeleteImageUseCase {
  constructor(private imageRepository: ImageRepository) {}

  async execute(imageId: string): Promise<boolean> {
    const image = await this.imageRepository.findById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    return await this.imageRepository.delete(imageId);
  }
}
