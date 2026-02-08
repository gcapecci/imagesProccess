/**
 * Use Case: List Images
 * Retrieves all images
 */
import { Image } from '../../domain/entities/Image';
import { ImageRepository } from '../../domain/repositories/ImageRepository';

export class ListImagesUseCase {
  constructor(private imageRepository: ImageRepository) {}

  async execute(): Promise<Image[]> {
    return await this.imageRepository.findAll();
  }
}
