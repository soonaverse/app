import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StakingPage } from './pages/staking/staking.page';

const routes: Routes = [
  {
    path: '',
    component: StakingPage,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SoonStakingRoutingModule {}
