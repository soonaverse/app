import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CollapseModule } from '@components/collapse/collapse.module';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { MarkDownModule } from '@core/pipes/markdown/markdown.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NftPreviewComponent } from './nft-preview.component';

@NgModule({
  declarations: [NftPreviewComponent],
  imports: [
    CommonModule,
    NzDrawerModule,
    NzModalModule,
    IconModule,
    NzCardModule,
    NzAvatarModule,
    RouterModule,
    NzIconModule,
    ResizeAvatarModule,
    MarkDownModule,
    CollapseModule,
    FormatTokenModule,
    NzToolTipModule,
    DescriptionModule,
  ],
  exports: [NftPreviewComponent],
})
export class NftPreviewModule {}
