import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClickOutsideModule } from '@core/directives/click-outside/click-outside.module';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { MobileSearchComponent } from './mobile-search.component';

@NgModule({
  declarations: [MobileSearchComponent],
  imports: [
    CommonModule,
    NzInputModule,
    FormsModule,
    ReactiveFormsModule,
    NzIconModule,
    ClickOutsideModule,
  ],
  exports: [MobileSearchComponent],
})
export class MobileSearchModule {}
