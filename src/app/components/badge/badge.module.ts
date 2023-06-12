import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { IpfsBadgeModule } from './../../@core/pipes/ipfs-badge/ipfs-badge.module';
import { BadgeTileComponent } from './badge-tile/badge-tile.component';

@NgModule({
  declarations: [BadgeTileComponent],
  exports: [BadgeTileComponent],
  imports: [CommonModule, NzAvatarModule, NzToolTipModule, IpfsBadgeModule, NzCardModule],
})
export class BadgeModule {}
