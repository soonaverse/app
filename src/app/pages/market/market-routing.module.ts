import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { CollectionsPage } from './pages/collections/collections.page';
import { MarketPage } from './pages/market/market.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTER_UTILS.config.market.collections,
    pathMatch: 'full',
  },
  {
    path: '',
    component: MarketPage,
    children: [{ path: ROUTER_UTILS.config.market.collections, component: CollectionsPage }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarketRoutingModule {}
