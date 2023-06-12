import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { AwardStatusComponent } from './award-status.component';

@NgModule({
  exports: [AwardStatusComponent],
  declarations: [AwardStatusComponent],
  imports: [CommonModule, NzTagModule],
})
export class AwardStatusModule {}
