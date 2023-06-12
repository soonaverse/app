import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { CountdownComponent } from './countdown.component';

@NgModule({
  declarations: [CountdownComponent],
  imports: [CommonModule, IconModule],
  exports: [CountdownComponent],
})
export class CountdownModule {}
