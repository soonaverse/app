import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ModalDrawerComponent } from './modal-drawer.component';

@NgModule({
  declarations: [ModalDrawerComponent],
  imports: [CommonModule, NzDrawerModule, NzModalModule, IconModule],
  exports: [ModalDrawerComponent],
})
export class ModalDrawerModule {}
