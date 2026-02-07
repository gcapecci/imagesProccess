import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2026 AI Image Processor. Built with Angular & Node.js</p>
        <div class="footer-links">
          <a href="#" mat-button>Privacy</a>
          <a href="#" mat-button>Terms</a>
          <a href="https://github.com" target="_blank" mat-button>
            <mat-icon>code</mat-icon>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: #424242;
      color: white;
      padding: 24px 0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-links {
      display: flex;
      gap: 16px;
    }

    .footer-links a {
      color: white;
    }

    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {}