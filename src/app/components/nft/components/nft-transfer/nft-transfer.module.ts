import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TransferModalComponent } from './nft-transfer.component';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ConnectWalletModule } from '@components/connect-wallet/connect-wallet.module';
import { NzNotificationModule } from 'ng-zorro-antd/notification';

@NgModule({
  declarations: [
    TransferModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzToolTipModule,
    NzCheckboxModule,
    NzButtonModule,
    ConnectWalletModule,
    NzNotificationModule,
  ],
  exports: [
    TransferModalComponent
  ]
})
export class NftTransferModule { }
