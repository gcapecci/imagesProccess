import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Third-party
import { NgxFileDropModule } from 'ngx-file-drop';

// Components
import { AppComponent } from './app.component';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { ImageProcessorComponent } from './components/image-processor/image-processor.component';
import { ModelSelectorComponent } from './components/model-selector/model-selector.component';
import { EnhancementControlsComponent } from './components/enhancement-controls/enhancement-controls.component';
import { EnhancementProcessorComponent } from './components/enhancement-processor/enhancement-processor.component';
import { CropControlsComponent } from './components/crop-controls/crop-controls.component';
import { CropProcessorComponent } from './components/crop-processor/crop-processor.component';
import { ResultComparisonComponent } from './components/result-comparison/result-comparison.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { BackgroundRemoverComponent } from './pages/background-remover/background-remover.component';
import { ImageEnhancementComponent } from './pages/image-enhancement/image-enhancement.component';
import { SmartCropComponent } from './pages/smart-crop/smart-crop.component';
import { HelpComponent } from './pages/help/help.component';

// Services
import { ImageService } from './services/image.service';
import { NotificationService } from './services/notification.service';

@NgModule({
  declarations: [
    AppComponent,
    ImageUploaderComponent,
    ImageProcessorComponent,
    ModelSelectorComponent,
    EnhancementControlsComponent,
    EnhancementProcessorComponent,
    CropControlsComponent,
    CropProcessorComponent,
    ResultComparisonComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    BackgroundRemoverComponent,
    ImageEnhancementComponent,
    SmartCropComponent,
    HelpComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatRadioModule,
    MatMenuModule,
    MatExpansionModule,
    MatSliderModule,
    MatSlideToggleModule,
    
    // Third-party
    NgxFileDropModule
  ],
  providers: [
    ImageService,
    NotificationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }