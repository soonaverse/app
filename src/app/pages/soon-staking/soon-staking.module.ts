import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { TokenStakeModule } from '@components/token/components/token-stake/token-stake.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { StakingPage } from './pages/staking/staking.page';
import { SoonStakingRoutingModule } from './soon-staking-routing.module';

@NgModule({
  declarations: [StakingPage],
  imports: [
    CommonModule,
    SoonStakingRoutingModule,
    NzCardModule,
    RouterModule,
    LayoutModule,
    IconModule,
    NzFormModule,
    NzAvatarModule,
    NzInputModule,
    NzButtonModule,
    NzToolTipModule,
    FormsModule,
    NzSelectModule,
    ReactiveFormsModule,
    FormatTokenModule,
    NzTableModule,
    TokenStakeModule,
  ],
  providers: [],
})
export class SoonStakingModule {}
