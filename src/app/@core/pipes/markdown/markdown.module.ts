import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MarkDownPipe } from './markdown.pipe';

@NgModule({
  declarations: [MarkDownPipe],
  imports: [CommonModule],
  exports: [MarkDownPipe],
})
export class MarkDownModule {}
