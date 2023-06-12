import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AccessBadgeComponent } from './collection-access-badge.component';

@NgModule({
  declarations: [AccessBadgeComponent],
  imports: [CommonModule, NzToolTipModule, IconModule],
  exports: [AccessBadgeComponent],
})
export class AccessBadgeModule {}
