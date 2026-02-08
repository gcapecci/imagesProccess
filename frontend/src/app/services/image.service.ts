import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface ProcessingResult {
  success: boolean;
  processedImage?: Blob;
  originalSize?: number;
  processedSize?: number;
  processingTime?: string;
  error?: string;
}

export interface EnhancementOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  autoEnhance: boolean;
  denoise: boolean;
}

export interface CropOptions {
  width: number;
  height: number;
  aspectRatio: string;
  autoDetect: boolean;
  x?: number;
  y?: number;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'downloading' | 'complete' | 'error';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = '/api'; // Proxy será configurado no nginx
  private uploadProgressSubject = new BehaviorSubject<UploadProgress>({
    progress: 0,
    status: 'uploading'
  });

  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Remove background from uploaded image
   */
  removeBackground(file: File, model: string = 'u2net'): Observable<ProcessingResult> {
    const formData = new FormData();
    formData.append('image', file);

    // Extended timeout for alpha matting (first request with isnet-general-use can take ~60s)
    const timeoutDuration = model === 'isnet-general-use' ? 180000 : 120000; // 3 min for premium, 2 min for standard

    return this.http.post(`${this.baseUrl}/images/remove-background?model=${model}`, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
      timeout(timeoutDuration),
      map((event: HttpEvent<Blob>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress: progress * 0.3, // Upload is 30% of total progress
                status: 'uploading',
                message: 'Uploading image...'
              });
            }
            return { success: false };

          case HttpEventType.Sent:
            // Upload complete, waiting for AI processing
            this.uploadProgressSubject.next({
              progress: 35,
              status: 'processing',
              message: model === 'isnet-general-use' 
                ? 'Processing with Premium Quality (Alpha Matting)...' 
                : 'Processing with AI...'
            });
            return { success: false };

          case HttpEventType.DownloadProgress:
            // AI processing complete, downloading result
            if (event.total) {
              const progress = 35 + Math.round(65 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress,
                status: 'downloading',
                message: 'Receiving processed image...'
              });
            }
            return { success: false };

          case HttpEventType.Response:
            this.uploadProgressSubject.next({
              progress: 100,
              status: 'complete',
              message: 'Processing complete!'
            });

            return {
              success: true,
              processedImage: event.body as Blob,
              originalSize: file.size,
              processedSize: event.body?.size || 0,
              processingTime: event.headers.get('X-Processing-Time') || 'unknown'
            };

          default:
            return { success: false };
        }
      }),
      catchError(error => {
        this.uploadProgressSubject.next({
          progress: 0,
          status: 'error',
          message: this.getErrorMessage(error)
        });
        
        return throwError(() => ({
          success: false,
          error: this.getErrorMessage(error)
        }));
      })
    );
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/images/formats`);
  }

  /**
   * Enhance image with brightness, contrast, saturation, sharpness
   */
  enhanceImage(file: File, options: EnhancementOptions): Observable<ProcessingResult> {
    const formData = new FormData();
    formData.append('image', file);

    const params = new URLSearchParams({
      brightness: options.brightness.toString(),
      contrast: options.contrast.toString(),
      saturation: options.saturation.toString(),
      sharpness: options.sharpness.toString(),
      auto_enhance: options.autoEnhance.toString(),
      denoise: options.denoise.toString()
    });

    return this.http.post(`${this.baseUrl}/images/enhance?${params}`, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
      timeout(120000),
      map((event: HttpEvent<Blob>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress: progress * 0.3,
                status: 'uploading',
                message: 'Uploading image...'
              });
            }
            return { success: false };

          case HttpEventType.Sent:
            this.uploadProgressSubject.next({
              progress: 35,
              status: 'processing',
              message: options.autoEnhance 
                ? 'Applying auto-enhancement...' 
                : 'Applying enhancements...'
            });
            return { success: false };

          case HttpEventType.DownloadProgress:
            if (event.total) {
              const progress = 35 + Math.round(65 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress,
                status: 'downloading',
                message: 'Receiving enhanced image...'
              });
            }
            return { success: false };

          case HttpEventType.Response:
            this.uploadProgressSubject.next({
              progress: 100,
              status: 'complete',
              message: 'Enhancement complete!'
            });

            return {
              success: true,
              processedImage: event.body as Blob,
              originalSize: file.size,
              processedSize: event.body?.size || 0,
              processingTime: event.headers.get('X-Processing-Time') || 'unknown'
            };

          default:
            return { success: false };
        }
      }),
      catchError(error => {
        this.uploadProgressSubject.next({
          progress: 0,
          status: 'error',
          message: this.getErrorMessage(error)
        });
        
        return throwError(() => ({
          success: false,
          error: this.getErrorMessage(error)
        }));
      })
    );
  }

  /**
   * Crop image with manual or auto-detect modes
   */
  cropImage(file: File, options: CropOptions): Observable<ProcessingResult> {
    const formData = new FormData();
    formData.append('image', file);

    const params = new URLSearchParams({
      width: options.width.toString(),
      height: options.height.toString(),
      auto_detect: options.autoDetect.toString()
    });

    // Add x, y coordinates if provided (manual crop position)
    if (options.x !== undefined) {
      params.append('x', options.x.toString());
    }
    if (options.y !== undefined) {
      params.append('y', options.y.toString());
    }

    return this.http.post(`${this.baseUrl}/images/crop?${params}`, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
      timeout(120000),
      map((event: HttpEvent<Blob>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress: progress * 0.3,
                status: 'uploading',
                message: 'Uploading image...'
              });
            }
            return { success: false };

          case HttpEventType.Sent:
            this.uploadProgressSubject.next({
              progress: 35,
              status: 'processing',
              message: options.autoDetect 
                ? 'AI detecting important areas...' 
                : 'Cropping image...'
            });
            return { success: false };

          case HttpEventType.DownloadProgress:
            if (event.total) {
              const progress = 35 + Math.round(65 * event.loaded / event.total);
              this.uploadProgressSubject.next({
                progress,
                status: 'downloading',
                message: 'Receiving cropped image...'
              });
            }
            return { success: false };

          case HttpEventType.Response:
            this.uploadProgressSubject.next({
              progress: 100,
              status: 'complete',
              message: 'Crop complete!'
            });

            return {
              success: true,
              processedImage: event.body as Blob,
              originalSize: file.size,
              processedSize: event.body?.size || 0,
              processingTime: event.headers.get('X-Processing-Time') || 'unknown'
            };

          default:
            return { success: false };
        }
      }),
      catchError(error => {
        this.uploadProgressSubject.next({
          progress: 0,
          status: 'error',
          message: this.getErrorMessage(error)
        });
        
        return throwError(() => ({
          success: false,
          error: this.getErrorMessage(error)
        }));
      })
    );
  }

  /**
   * Get processing statistics
   */
  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/images/stats`);
  }

  /**
   * Download processed image
   */
  downloadImage(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Check if file is a valid image
   */
  isValidImage(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    return validTypes.includes(file.type);
  }

  /**
   * Check file size
   */
  isValidSize(file: File): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return file.size <= maxSize;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get error message from HTTP error
   */
  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    } else if (error.status) {
      switch (error.status) {
        case 413:
          return 'File size too large. Please upload a smaller image.';
        case 400:
          return 'Invalid image format. Please upload a valid image file.';
        case 503:
          return 'AI service is temporarily unavailable. Please try again later.';
        case 0:
          return 'Unable to connect to server. Please check your internet connection.';
        default:
          return `Server error (${error.status}). Please try again.`;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Reset upload progress
   */
  resetProgress() {
    this.uploadProgressSubject.next({
      progress: 0,
      status: 'uploading'
    });
  }

  /**
   * Simulate processing progress (when we can't get real progress from server)
   */
  simulateProcessingProgress() {
    let progress = 30; // Start after upload
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 95) {
        progress = 95; // Don't reach 100% until we get response
      }
      
      this.uploadProgressSubject.next({
        progress,
        status: 'processing',
        message: 'AI is processing your image...'
      });
    }, 500);

    return interval;
  }
}