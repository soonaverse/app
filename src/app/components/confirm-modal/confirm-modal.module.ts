import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ConfirmModalComponent } from './confirm-modal.component';

@NgModule({
  declarations: [ConfirmModalComponent],
  imports: [CommonModule, NzModalModule, IconModule, NzButtonModule],
  exports: [ConfirmModalComponent],
})
export class ConfirmModalModule {}
