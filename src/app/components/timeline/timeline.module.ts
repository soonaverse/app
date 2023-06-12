import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CollapseModule } from '@components/collapse/collapse.module';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { IpfsBadgeModule } from '@core/pipes/ipfs-badge/ipfs-badge.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TimelineComponent } from './timeline.component';

@NgModule({
  declarations: [TimelineComponent],
  imports: [
    CommonModule,
    NzAvatarModule,
    NzCardModule,
    NzPopoverModule,
    NzCollapseModule,
    IconModule,
    IpfsBadgeModule,
    NzButtonModule,
    CollapseModule,
    FormatTokenModule,
    ResizeAvatarModule,
    TruncateModule,
    RouterModule,
  ],
  exports: [TimelineComponent],
})
export class TimelineModule {}
