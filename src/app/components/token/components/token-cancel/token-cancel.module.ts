import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TokenCancelComponent } from './token-cancel.component';

@NgModule({
  declarations: [TokenCancelComponent],
  imports: [
    CommonModule,
    ModalDrawerModule,
    NzButtonModule,
    IconModule,
    NzAvatarModule,
    FormatTokenModule,
  ],
  exports: [TokenCancelComponent],
})
export class TokenCancelModule {}
