import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UnknownIfZeroPipe } from './unknown-if-zero.pipe';

@NgModule({
  declarations: [UnknownIfZeroPipe],
  imports: [CommonModule],
  exports: [UnknownIfZeroPipe],
})
export class UnknownIfZeroModule {}
