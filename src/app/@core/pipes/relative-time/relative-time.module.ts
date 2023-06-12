import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RelativeTime } from './relative-time.pipe';

@NgModule({
  declarations: [RelativeTime],
  imports: [CommonModule],
  exports: [RelativeTime],
})
export class RelativeTimeModule {}
