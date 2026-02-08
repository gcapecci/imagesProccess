/**
 * Infrastructure: File System Image Repository
 * Concrete implementation of ImageRepository interface
 * Handles file system operations
 */
import { Image } from '../../domain/entities/Image';
import { ImageRepository } from '../../domain/repositories/ImageRepository';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export class FileSystemImageRepository implements ImageRepository {
  private images: Map<string, Image> = new Map();
  private uploadDir: string;

  constructor(uploadDir: string = 'public/uploads') {
    this.uploadDir = uploadDir;
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async save(file: Express.Multer.File): Promise<Image> {
    const id = uuidv4();
    const fileName = `${id}_${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    const image: Image = {
      id,
      originalName: file.originalname,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    this.images.set(id, image);
    return image;
  }

  async findById(id: string): Promise<Image | null> {
    return this.images.get(id) || null;
  }

  async findAll(): Promise<Image[]> {
    return Array.from(this.images.values());
  }

  async delete(id: string): Promise<boolean> {
    const image = this.images.get(id);
    if (!image) {
      return false;
    }

    try {
      const filePath = path.join(this.uploadDir, image.fileName);
      await fs.unlink(filePath);
      this.images.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  getImagePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }
}
