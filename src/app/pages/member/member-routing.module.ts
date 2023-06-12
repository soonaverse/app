import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { ActivityPage } from './pages/activity/activity.page';
import { AwardsPage } from './pages/awards/awards.page';
import { BadgesPage } from './pages/badges/badges.page';
import { MemberPage } from './pages/member/member.page';
import { NFTsPage } from './pages/nfts/nfts.page';
import { MemberSpacesComponent } from './pages/spaces/member-spaces.component';
import { TokensPage } from './pages/tokens/tokens.page';
import { TransactionsPage } from './pages/transactions/transactions.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.member.member,
    component: MemberPage,
    children: [
      {
        path: '',
        redirectTo: ROUTER_UTILS.config.member.badges,
        pathMatch: 'full',
      },
      { path: ROUTER_UTILS.config.member.activity, component: ActivityPage },
      { path: ROUTER_UTILS.config.member.awards, component: AwardsPage },
      { path: ROUTER_UTILS.config.member.badges, component: BadgesPage },
      { path: ROUTER_UTILS.config.member.spaces, component: MemberSpacesComponent },
      { path: ROUTER_UTILS.config.member.nfts, component: NFTsPage },
      { path: ROUTER_UTILS.config.member.tokens, component: TokensPage },
      { path: ROUTER_UTILS.config.member.transactions, component: TransactionsPage },
    ],
  },
  {
    path: '',
    redirectTo: '/' + ROUTER_UTILS.config.discover.root + '/' + ROUTER_UTILS.config.discover.spaces,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
