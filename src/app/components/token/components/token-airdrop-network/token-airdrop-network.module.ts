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
import { TokenAirdropNetworkComponent } from './token-airdrop-network.component';

@NgModule({
  declarations: [TokenAirdropNetworkComponent],
  imports: [
    CommonModule,
    ModalDrawerModule,
    NzButtonModule,
    IconModule,
    FormatTokenModule,
    WalletDeeplinkModule,
    TermsAndConditionsModule,
    NzAlertModule,
    NetworkModule,
    CountdownTimeModule,
    TimeModule,
    NzAvatarModule,
    TransactionStepsModule,
  ],
  providers: [PercentPipe],
  exports: [TokenAirdropNetworkComponent],
})
export class TokenAirdropNetworkModule {}
