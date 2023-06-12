import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { TruncateModule } from './../../../../@core/pipes/truncate/truncate.module';
import { IconModule } from './../../../../components/icon/icon.module';
import { ProposalStatusModule } from './../proposal-status/proposal-status.module';
import { ProposalCardComponent } from './proposal-card.component';

@NgModule({
  exports: [ProposalCardComponent],
  declarations: [ProposalCardComponent],
  imports: [
    CommonModule,
    RouterModule,
    TruncateModule,
    ProposalStatusModule,
    NzAvatarModule,
    NzTagModule,
    NzIconModule,
    IconModule,
    NzProgressModule,
    NgChartsModule,
    NzToolTipModule,
  ],
})
export class ProposalCardModule {}
