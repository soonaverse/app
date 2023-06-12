import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProposalCardModule } from '@components/proposal/components/proposal-card/proposal-card.module';
import { SpaceModule } from '@components/space/space.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { AwardCardModule } from './../../components/award/components/award-card/award-card.module';
import { DashboardPage } from './dashboard.page';

@NgModule({
  declarations: [DashboardPage],
  imports: [
    CommonModule,
    SpaceModule,
    ProposalCardModule,
    AwardCardModule,
    RouterModule.forChild([
      {
        path: '',
        component: DashboardPage,
        data: {
          title: 'Dashboard',
          robots: 'noindex, nofollow',
        },
      },
    ]),
    NzButtonModule,
    NzIconModule,
    LayoutModule,
    NzSkeletonModule,
    NzCardModule,
  ],
})
export class DashboardModule {}
