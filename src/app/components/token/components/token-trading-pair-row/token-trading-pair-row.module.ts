import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { UnknownIfZeroModule } from '@core/pipes/unknown-if-zero/unknown-if-zero.module';
import { UsdBelowTwoDecimalsModule } from '@core/pipes/usd-below-two-decimals/usd-below-two-decimals.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TokenTradingPairRowComponent } from './token-trading-pair-row.component';

@NgModule({
  declarations: [TokenTradingPairRowComponent],
  imports: [
    CommonModule,
    NzAvatarModule,
    RouterModule,
    IconModule,
    NzButtonModule,
    FormatTokenModule,
    NzSkeletonModule,
    UsdBelowTwoDecimalsModule,
    UnknownIfZeroModule,
  ],
  exports: [TokenTradingPairRowComponent],
})
export class TokenTradingPairRowModule {}
