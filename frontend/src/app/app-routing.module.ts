import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { BackgroundRemoverComponent } from './pages/background-remover/background-remover.component';
import { ImageEnhancementComponent } from './pages/image-enhancement/image-enhancement.component';
import { HelpComponent } from './pages/help/help.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'background-remover',
    component: BackgroundRemoverComponent
  },
  {
    path: 'image-enhancement',
    component: ImageEnhancementComponent
  },
  {
    path: 'help',
    component: HelpComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
