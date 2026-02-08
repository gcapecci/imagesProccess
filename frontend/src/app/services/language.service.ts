import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'ai-image-language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly supportedLangs = ['en', 'pt'];

  constructor(@Inject(TranslateService) private translate: TranslateService) {
    this.translate.addLangs(this.supportedLangs);
    const saved = this.getStoredLanguage();
    const initial = this.supportedLangs.includes(saved) ? saved : 'en';
    this.setLanguage(initial);
  }

  get currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  setLanguage(lang: string): void {
    if (!this.supportedLangs.includes(lang)) {
      lang = 'en';
    }
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  private getStoredLanguage(): string {
    if (typeof localStorage === 'undefined') {
      return 'en';
    }
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }
}
