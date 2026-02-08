/**
 * Use Case: Get Image
 * Retrieves image information
 */
import { Image } from '../../domain/entities/Image';
import { ImageRepository } from '../../domain/repositories/ImageRepository';

export class GetImageUseCase {
  constructor(private imageRepository: ImageRepository) {}

  async execute(imageId: string): Promise<Image | null> {
    return await this.imageRepository.findById(imageId);
  }
}
