import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { TruncateModule } from '../../../../@core/pipes/truncate/truncate.module';
import { MemberTileComponent } from './member-tile.component';

@NgModule({
  exports: [MemberTileComponent],
  declarations: [MemberTileComponent],
  imports: [CommonModule, RouterModule, TruncateModule, NzCardModule, NzStatisticModule],
})
export class MemberTileModule {}
