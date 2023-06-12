import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NetworkStatusComponent } from './network-status.component';

@NgModule({
  declarations: [NetworkStatusComponent],
  imports: [CommonModule, IconModule, NzDrawerModule],
  exports: [NetworkStatusComponent],
})
export class NetworkStatusModule {}
