import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NetworkModule } from '@components/network/network.module';
import { TransactionStepsModule } from '@components/transaction-steps/transaction-steps.module';
import { WalletDeeplinkModule } from '@components/wallet-deeplink/wallet-deeplink.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ManageAddressesComponent } from './manage-addresses/manage-addresses.component';
import { VerifyAddressComponent } from './verify-address/verify-address.component';
import { WalletAddressComponent } from './wallet-address.component';

@NgModule({
  declarations: [WalletAddressComponent, VerifyAddressComponent, ManageAddressesComponent],
  imports: [
    CommonModule,
    NzDrawerModule,
    NzModalModule,
    NetworkModule,
    IconModule,
    CountdownTimeModule,
    NzButtonModule,
    TimeModule,
    FormatTokenModule,
    NzAlertModule,
    TruncateModule,
    WalletDeeplinkModule,
    TransactionStepsModule,
    ModalDrawerModule,
    NzTableModule,
    NzIconModule,
  ],
  exports: [WalletAddressComponent],
})
export class WalletAddressModule {}
