import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { AirdropsPage } from './pages/airdrops/airdrops.page';
import { MetricsPage } from './pages/metrics/metrics.page';
import { NewPage } from './pages/new/new.page';
import { OverviewPage } from './pages/overview/overview.page';
import { TokenPage } from './pages/token/token.page';
import { TradePage } from './pages/trade/trade.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.token.newToken,
    component: NewPage,
  },
  {
    path: ROUTER_UTILS.config.token.token,
    component: TokenPage,
    children: [
      {
        path: '',
        redirectTo: ROUTER_UTILS.config.token.overview,
        pathMatch: 'full',
      },
      { path: ROUTER_UTILS.config.token.overview, component: OverviewPage },
      { path: ROUTER_UTILS.config.token.metrics, component: MetricsPage },
      { path: ROUTER_UTILS.config.token.airdrops, component: AirdropsPage },
    ],
  },
  {
    path: ROUTER_UTILS.config.token.token + '/' + ROUTER_UTILS.config.token.trade,
    component: TradePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TokenRoutingModule {}
