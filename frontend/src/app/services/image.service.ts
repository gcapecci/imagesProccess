import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface ProcessingResult {
  success: boolean;
  processedImage?: Blob;
  originalSize?: number;
  processedSize?: number;
  processingTime?: string;
  error?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
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
  removeBackground(file: File): Observable<ProcessingResult> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(`${this.baseUrl}/images/remove-background`, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(
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