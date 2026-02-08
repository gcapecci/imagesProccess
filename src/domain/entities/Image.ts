/**
 * Domain Entity: Image
 * Represents the core business entity for an image in the system
 */
export interface Image {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: Date;
}

/**
 * Image processing options
 */
export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  grayscale?: boolean;
  blur?: number;
  rotate?: number;
}
