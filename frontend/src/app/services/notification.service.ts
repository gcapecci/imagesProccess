import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success notification
   */
  showSuccess(message: string, duration: number = 3000) {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    };

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Show error notification
   */
  showError(message: string, duration: number = 5000) {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    };

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Show info notification
   */
  showInfo(message: string, duration: number = 3000) {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    };

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Show warning notification
   */
  showWarning(message: string, duration: number = 4000) {
    const config: MatSnackBarConfig = {
      duration: duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    };

    this.snackBar.open(message, 'Close', config);
  }
}