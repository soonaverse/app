import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NftStakeComponent } from './nft-stake.component';

@NgModule({
  declarations: [NftStakeComponent],
  imports: [
    CommonModule,
    ModalDrawerModule,
    NzButtonModule,
    NetworkModule,
    IconModule,
    TermsAndConditionsModule,
    NzAlertModule,
    ReactiveFormsModule,
    NzSelectModule,
    CountdownTimeModule,
    TimeModule,
    NzAvatarModule,
    TransactionStepsModule,
  ],
  exports: [NftStakeComponent],
})
export class NftStakeModule {}
