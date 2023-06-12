import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { NetworkModule } from '@components/network/network.module';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { WalletDeeplinkModule } from '@components/wallet-deeplink/wallet-deeplink.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { RelativeTimeModule } from '@core/pipes/relative-time/relative-time.module';
import { TimeModule } from '@core/pipes/time/time.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TokenPurchaseComponent } from './token-purchase.component';

@NgModule({
  declarations: [TokenPurchaseComponent],
  imports: [
    CommonModule,
    NzModalModule,
    NzDrawerModule,
    IconModule,
    NetworkModule,
    NzButtonModule,
    NzCheckboxModule,
    NzAvatarModule,
    RelativeTimeModule,
    TimeModule,
    NzInputModule,
    FormsModule,
    ReactiveFormsModule,
    FormatTokenModule,
    DescriptionModule,
    ModalDrawerModule,
    WalletDeeplinkModule,
    TermsAndConditionsModule,
  ],
  exports: [TokenPurchaseComponent],
})
export class TokenPurchaseModule {}
