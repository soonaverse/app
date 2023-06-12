import { CommonModule, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NetworkModule } from '@components/network/network.module';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { TransactionStepsModule } from '@components/transaction-steps/transaction-steps.module';
import { WalletDeeplinkModule } from '@components/wallet-deeplink/wallet-deeplink.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TokenMintNetworkComponent } from './token-mint-network.component';

@NgModule({
  declarations: [TokenMintNetworkComponent],
  imports: [
    CommonModule,
    ModalDrawerModule,
    NzButtonModule,
    IconModule,
    WalletDeeplinkModule,
    TermsAndConditionsModule,
    NzAlertModule,
    NetworkModule,
    FormatTokenModule,
    CountdownTimeModule,
    TimeModule,
    NzAvatarModule,
    TransactionStepsModule,
  ],
  providers: [PercentPipe],
  exports: [TokenMintNetworkComponent],
})
export class TokenMintNetworkModule {}
