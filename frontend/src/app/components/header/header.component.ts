import { Component } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  currentLang: string;

  constructor(private languageService: LanguageService) {
    this.currentLang = this.languageService.currentLang;
  }

  changeLanguage(lang: string) {
    this.languageService.setLanguage(lang);
    this.currentLang = this.languageService.currentLang;
  }
}
