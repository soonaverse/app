import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TransferModalComponent } from './nft-transfer.component';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ConnectWalletModule } from '@components/connect-wallet/connect-wallet.module';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';

@NgModule({
  declarations: [
    TransferModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzFormModule,
    ReactiveFormsModule,
    NzInputModule,
    NzToolTipModule,
    NzCheckboxModule,
    NzButtonModule,
    ConnectWalletModule,
    NzNotificationModule,
    NzRadioModule,
    NzSelectModule,
  ],
  exports: [
    TransferModalComponent
  ]
})
export class NftTransferModule { }
