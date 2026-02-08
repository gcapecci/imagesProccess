/**
 * Domain Interface: Image Repository
 * Defines the contract for image storage operations
 * Following Dependency Inversion Principle - domain defines the interface
 */
import { Image } from '../entities/Image';

export interface ImageRepository {
  save(file: Express.Multer.File): Promise<Image>;
  findById(id: string): Promise<Image | null>;
  findAll(): Promise<Image[]>;
  delete(id: string): Promise<boolean>;
  getImagePath(fileName: string): string;
}
