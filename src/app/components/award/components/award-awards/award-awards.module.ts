import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { IpfsBadgeModule } from '@core/pipes/ipfs-badge/ipfs-badge.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AwardGiveBadgesModule } from '../award-give-badges/award-give-badges.module';
import { AwardAwardsComponent } from './award-awards.component';

@NgModule({
  declarations: [AwardAwardsComponent],
  imports: [
    CommonModule,
    NzCardModule,
    NzAvatarModule,
    IpfsBadgeModule,
    FormatTokenModule,
    NzTagModule,
    NzToolTipModule,
    IconModule,
    NzButtonModule,
    AwardGiveBadgesModule,
  ],
  exports: [AwardAwardsComponent],
})
export class AwardAwardsModule {}
