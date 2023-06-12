import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TokenCancelSaleComponent } from './token-cancel-sale.component';

@NgModule({
  declarations: [TokenCancelSaleComponent],
  imports: [CommonModule, ModalDrawerModule, IconModule, NzButtonModule],
  exports: [TokenCancelSaleComponent],
})
export class TokenCancelSaleModule {}
