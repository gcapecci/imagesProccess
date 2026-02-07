import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <div class="toolbar-content">
        <div class="logo-section">
          <mat-icon class="logo-icon">photo_camera</mat-icon>
          <span class="app-title">AI Image Processor</span>
        </div>
        
        <div class="nav-section">
          <button mat-button class="nav-button">
            <mat-icon>info</mat-icon>
            About
          </button>
          <button mat-button class="nav-button">
            <mat-icon>help</mat-icon>
            Help
          </button>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toolbar-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .app-title {
      font-size: 1.5rem;
      font-weight: 300;
    }

    .nav-section {
      display: flex;
      gap: 8px;
    }

    .nav-button {
      color: white;
      
      .mat-icon {
        margin-right: 4px;
      }
    }

    @media (max-width: 768px) {
      .app-title {
        font-size: 1.2rem;
      }
      
      .nav-button span {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {}