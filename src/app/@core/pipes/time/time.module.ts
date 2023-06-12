import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Time } from './time.pipe';

@NgModule({
  declarations: [Time],
  imports: [CommonModule],
  exports: [Time],
})
export class TimeModule {}
