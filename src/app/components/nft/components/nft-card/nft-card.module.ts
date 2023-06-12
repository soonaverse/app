import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccessBadgeModule } from '@components/collection/components/collection-access-badge/collection-access-badge.module';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { StripMarkDownModule } from '@core/pipes/strip-markdown/strip-markdown.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NftCardComponent } from './nft-card.component';

@NgModule({
  declarations: [NftCardComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormatTokenModule,
    StripMarkDownModule,
    TruncateModule,
    IconModule,
    NzButtonModule,
    NzNotificationModule,
    NzAvatarModule,
    NzToolTipModule,
    ResizeAvatarModule,
    AccessBadgeModule,
  ],
  exports: [NftCardComponent],
})
export class NftCardModule {}
