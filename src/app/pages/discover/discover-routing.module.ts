import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { AwardsPage } from './pages/awards/awards.page';
import { DiscoverPage } from './pages/discover/discover.page';
import { MembersPage } from './pages/members/members.page';
import { ProposalsPage } from './pages/proposals/proposals.page';
import { SpacesPage } from './pages/spaces/spaces.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTER_UTILS.config.discover.spaces,
    pathMatch: 'full',
  },
  {
    path: '',
    component: DiscoverPage,
    children: [
      { path: ROUTER_UTILS.config.discover.spaces, component: SpacesPage },
      { path: ROUTER_UTILS.config.discover.awards, component: AwardsPage },
      { path: ROUTER_UTILS.config.discover.proposals, component: ProposalsPage },
      { path: ROUTER_UTILS.config.discover.members, component: MembersPage },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DiscoverRoutingModule {}
