import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CountdownTime } from './countdown-time.pipe';

@NgModule({
  declarations: [CountdownTime],
  imports: [CommonModule],
  exports: [CountdownTime],
})
export class CountdownTimeModule {}
