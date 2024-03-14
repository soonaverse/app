import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NetworkModule } from '@components/network/network.module';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { WalletDeeplinkModule } from '@components/wallet-deeplink/wallet-deeplink.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NftCheckoutComponent } from './nft-checkout.component';
import { UsdBelowTwoDecimalsModule } from '@core/pipes/usd-below-two-decimals/usd-below-two-decimals.module';

@NgModule({
  declarations: [NftCheckoutComponent],
  imports: [
    RouterModule,
    CommonModule,
    NzDrawerModule,
    FormatTokenModule,
    NzModalModule,
    IconModule,
    TimeModule,
    NzToolTipModule,
    NetworkModule,
    NzCheckboxModule,
    NzButtonModule,
    CountdownTimeModule,
    NzAlertModule,
    TruncateModule,
    NzNotificationModule,
    NzAvatarModule,
    ModalDrawerModule,
    WalletDeeplinkModule,
    TermsAndConditionsModule,
    UsdBelowTwoDecimalsModule,
  ],
  exports: [NftCheckoutComponent],
})
export class NftCheckoutModule {}
