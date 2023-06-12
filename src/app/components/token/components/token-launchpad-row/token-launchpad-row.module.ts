import { CommonModule, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { UsdBelowTwoDecimalsModule } from '@core/pipes/usd-below-two-decimals/usd-below-two-decimals.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TokenLaunchpadRowComponent } from './token-launchpad-row.component';

@NgModule({
  declarations: [TokenLaunchpadRowComponent],
  imports: [
    CommonModule,
    NzAvatarModule,
    NzProgressModule,
    NzButtonModule,
    NzSkeletonModule,
    FormatTokenModule,
    UsdBelowTwoDecimalsModule,
    NzTagModule,
    RouterModule,
  ],
  providers: [PercentPipe],
  exports: [TokenLaunchpadRowComponent],
})
export class TokenLaunchpadRowModule {}
