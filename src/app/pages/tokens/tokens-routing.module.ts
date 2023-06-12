import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { AllTokensPage } from './pages/all-tokens/all-tokens.page';
import { FavouritesPage } from './pages/favourites/favourites.page';
import { LaunchpadPage } from './pages/launchpad/launchpad.page';
import { TokensPage } from './pages/tokens/tokens.page';
import { TradingPairsPage } from './pages/trading-pairs/trading-pairs.page';

const routes: Routes = [
  {
    path: '',
    component: TokensPage,
    children: [
      {
        path: '',
        redirectTo: ROUTER_UTILS.config.tokens.allTokens,
        pathMatch: 'full',
      },
      { path: ROUTER_UTILS.config.tokens.favourites, component: FavouritesPage },
      { path: ROUTER_UTILS.config.tokens.allTokens, component: AllTokensPage },
      { path: ROUTER_UTILS.config.tokens.tradingPairs, component: TradingPairsPage },
      { path: ROUTER_UTILS.config.tokens.launchpad, component: LaunchpadPage },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TokensRoutingModule {}
