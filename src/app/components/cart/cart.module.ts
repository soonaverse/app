import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CartModalComponent } from './components/cart-modal/cart-modal.component';
import { IconModule } from '@components/icon/icon.module';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { CheckoutOverlayComponent } from './components/checkout/checkout-overlay.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NetworkModule } from '@components/network/network.module';
import { RouterModule } from '@angular/router';
import { WalletDeeplinkModule } from '@components/wallet-deeplink/wallet-deeplink.module';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { UsdBelowTwoDecimalsModule } from '@core/pipes/usd-below-two-decimals/usd-below-two-decimals.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ConnectWalletModule } from '@components/connect-wallet/connect-wallet.module';
//import { DataService } from '@pages/member/services/data.service';
//import { AlgoliaModule } from '@components/algolia/algolia.module';

@NgModule({
  declarations: [CartModalComponent, CheckoutOverlayComponent],
  imports: [
    CommonModule,
    NzModalModule,
    NzButtonModule,
    IconModule,
    NzNotificationModule,
    FormatTokenModule,
    FormsModule,
    NzInputNumberModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDividerModule,
    NzTableModule,
    NzTagModule,
    NzEmptyModule,
    TermsAndConditionsModule,
    TimeModule,
    CountdownTimeModule,
    NzAlertModule,
    NetworkModule,
    RouterModule,
    WalletDeeplinkModule,
    NzRadioModule,
    UsdBelowTwoDecimalsModule,
    NzToolTipModule,
    ConnectWalletModule,
    //DataService,
    //AlgoliaModule,
  ],
  exports: [CartModalComponent, CheckoutOverlayComponent],
})
export class CartModule {}
