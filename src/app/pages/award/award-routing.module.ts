import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '../../@core/utils/router.utils';
import { AwardPage } from './pages/award/award.page';
import { NewPage } from './pages/new/new.page';
import { OverviewPage } from './pages/overview/overview.page';
import { ParticipantsPage } from './pages/participants/participants.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.award.newAward,
    component: NewPage,
  },
  {
    path: ROUTER_UTILS.config.award.award,
    component: AwardPage,
    children: [
      {
        path: '',
        redirectTo: ROUTER_UTILS.config.award.overview,
        pathMatch: 'full',
      },
      { path: ROUTER_UTILS.config.award.overview, component: OverviewPage },
      { path: ROUTER_UTILS.config.award.participants, component: ParticipantsPage },
    ],
  },
  {
    path: '',
    redirectTo: '/' + ROUTER_UTILS.config.discover.root + '/' + ROUTER_UTILS.config.discover.awards,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AwardRoutingModule {}
