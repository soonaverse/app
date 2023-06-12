import { CommonModule, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NetworkModule } from '@components/network/network.module';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { WalletDeeplinkModule } from '@components/wallet-deeplink/wallet-deeplink.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { UsdBelowTwoDecimalsModule } from '@core/pipes/usd-below-two-decimals/usd-below-two-decimals.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TokenOfferMintComponent } from './token-offer-mint.component';

@NgModule({
  declarations: [TokenOfferMintComponent],
  imports: [
    CommonModule,
    NzModalModule,
    NzDrawerModule,
    IconModule,
    NzButtonModule,
    NzCheckboxModule,
    NzAvatarModule,
    NzInputModule,
    NetworkModule,
    TimeModule,
    FormsModule,
    CountdownTimeModule,
    UsdBelowTwoDecimalsModule,
    NzAlertModule,
    ReactiveFormsModule,
    ModalDrawerModule,
    FormatTokenModule,
    WalletDeeplinkModule,
    TermsAndConditionsModule,
    DescriptionModule,
  ],
  providers: [PercentPipe],
  exports: [TokenOfferMintComponent],
})
export class TokenOfferMintModule {}
