import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OnVisibleDirective } from './on-visible.directive';

@NgModule({
  declarations: [OnVisibleDirective],
  imports: [CommonModule],
  exports: [OnVisibleDirective],
})
export class OnVisibleModule {}
