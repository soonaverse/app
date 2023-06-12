import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ConvertTokenPipe } from './convert-token.pipe';
import { FormatTokenPipe } from './format-token.pipe';

@NgModule({
  declarations: [FormatTokenPipe, ConvertTokenPipe],
  imports: [CommonModule],
  exports: [FormatTokenPipe, ConvertTokenPipe],
})
export class FormatTokenModule {}
