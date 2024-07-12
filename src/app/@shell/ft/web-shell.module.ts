import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { NotFoundModule } from '@shell/ui/not-found/not-found.module';
import { FooterModule } from '../ui/footer/footer.module';
import { HeaderModule } from '../ui/header/header.module';
import { LayoutModule } from '../ui/layout/layout.module';
import { NotFoundPage } from '../ui/not-found/not-found.page';

const APP_ROUTES: Routes = [
  {
    path: ROUTER_UTILS.config.auth.root,
    loadChildren: async () => (await import('@components/auth/auth.module')).AuthModule,
    canLoad: [],
  },
{
    path: ROUTER_UTILS.config.base.home,
    loadChildren: async () => (await import('@pages/discover/discover.module')).DiscoverModule,
    canActivate: [() => {
      // Hack to force homepage.
      window.location.href = 'https://soonaverse.com/home/';
    }],
    // redirectTo: ROUTER_UTILS.config.discover.root,
    // pathMatch: 'full',
  },
  // {
  //   path: ROUTER_UTILS.config.base.dashboard,
  //   loadChildren: async () => (await import('@pages/dashboard/dashboard.module')).DashboardModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.discover.root,
  //   loadChildren: async () => (await import('@pages/discover/discover.module')).DiscoverModule,
  //   canLoad: [],
  // },
  {
    path: ROUTER_UTILS.config.member.root,
    loadChildren: async () => (await import('@pages/member/member.module')).MemberModule,
    canLoad: [],
  },
  // {
  //   path: ROUTER_UTILS.config.space.root,
  //   loadChildren: async () => (await import('@pages/space/space.module')).SpaceModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.proposal.root,
  //   loadChildren: async () => (await import('@pages/proposal/proposal.module')).ProposalModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.award.root,
  //   loadChildren: async () => (await import('@pages/award/award.module')).AwardModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.market.root,
  //   loadChildren: async () => (await import('@pages/market/market.module')).MarketModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.swap.root,
  //   loadChildren: async () => (await import('@pages/swap/swap.module')).SwapModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.soonStaking.root,
  //   loadChildren: async () =>
  //     (await import('@pages/soon-staking/soon-staking.module')).SoonStakingModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.farming.farming,
  //   loadChildren: async () => (await import('@pages/pool/pool.module')).PoolModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.collection.root,
  //   loadChildren: async () =>
  //     (await import('@pages/collection/collection.module')).CollectionModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.nft.root,
  //   loadChildren: async () => (await import('@pages/nft/nft.module')).NFTModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.token.root,
  //   loadChildren: async () => (await import('@pages/token/token.module')).TokenModule,
  //   canLoad: [],
  // },
  // {
  //   path: ROUTER_UTILS.config.tokens.root,
  //   loadChildren: async () => (await import('@pages/tokens/tokens.module')).TokensModule,
  //   canLoad: [],
  // },
  {
    path: '**',
    loadChildren: async () => (await import('@shell/ui/not-found/not-found.module')).NotFoundModule,
    component: NotFoundPage,
  },
  // {
  //   path: ROUTER_UTILS.config.base.home,
  //   loadChildren: async () => (await import('@pages/market/market.module')).MarketModule,
  //   canLoad: [],
  // },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(APP_ROUTES, {
      onSameUrlNavigation: 'reload',
      initialNavigation: 'enabledBlocking',
    }),
    FooterModule,
    HeaderModule,
    LayoutModule,
    NotFoundModule,
  ],
  exports: [RouterModule, FooterModule, HeaderModule, LayoutModule, NotFoundModule],
})
export class WebShellModule {}
