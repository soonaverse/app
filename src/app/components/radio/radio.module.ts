import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { RadioComponent } from './radio.component';

@NgModule({
  exports: [RadioComponent],
  declarations: [RadioComponent],
  imports: [CommonModule, NzRadioModule],
})
export class RadioModule {}
