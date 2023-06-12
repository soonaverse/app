import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { RelativeTimeModule } from '@core/pipes/relative-time/relative-time.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CollectionHighlightCardComponent } from './collection-highlight-card.component';

@NgModule({
  declarations: [CollectionHighlightCardComponent],
  imports: [
    CommonModule,
    NzCardModule,
    NzAvatarModule,
    NzTableModule,
    FormatTokenModule,
    RouterModule,
    RelativeTimeModule,
  ],
  exports: [CollectionHighlightCardComponent],
})
export class CollectionHighlightCardModule {}
