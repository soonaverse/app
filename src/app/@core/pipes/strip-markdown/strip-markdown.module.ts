import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StripMarkDownPipe } from './strip-markdown.pipe';

@NgModule({
  declarations: [StripMarkDownPipe],
  imports: [CommonModule],
  exports: [StripMarkDownPipe],
})
export class StripMarkDownModule {}
