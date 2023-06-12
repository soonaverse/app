import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NetworkModule } from '@components/network/network.module';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { TransactionStepsModule } from '@components/transaction-steps/transaction-steps.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NftDepositComponent } from './nft-deposit.component';

@NgModule({
  declarations: [NftDepositComponent],
  imports: [
    CommonModule,
    ModalDrawerModule,
    NzButtonModule,
    NetworkModule,
    IconModule,
    TermsAndConditionsModule,
    NzAlertModule,
    CountdownTimeModule,
    TimeModule,
    NzAvatarModule,
    TransactionStepsModule,
  ],
  exports: [NftDepositComponent],
})
export class NftDepositModule {}
