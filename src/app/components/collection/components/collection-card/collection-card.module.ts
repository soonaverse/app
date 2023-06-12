import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { StripMarkDownModule } from '@core/pipes/strip-markdown/strip-markdown.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AccessBadgeModule } from '../collection-access-badge/collection-access-badge.module';
import { CollectionCardComponent } from './collection-card.component';

@NgModule({
  declarations: [CollectionCardComponent],
  imports: [
    CommonModule,
    RouterModule,
    StripMarkDownModule,
    TruncateModule,
    NzAvatarModule,
    FormatTokenModule,
    NzToolTipModule,
    IconModule,
    AccessBadgeModule,
  ],
  exports: [CollectionCardComponent],
})
export class CollectionCardModule {}
