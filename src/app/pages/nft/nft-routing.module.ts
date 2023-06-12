import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { MultiplePage } from './pages/new/multiple/multiple.page';
import { NewPage } from './pages/new/new.page';
import { SinglePage } from './pages/new/single/single.page';
import { NFTPage } from './pages/nft/nft.page';
import { NotFoundPage } from './pages/not-found/not-found.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.nft.newNft,
    component: NewPage,
    children: [
      { path: '', redirectTo: ROUTER_UTILS.config.nft.single, pathMatch: 'full' },
      { path: ROUTER_UTILS.config.nft.single, component: SinglePage },
      { path: ROUTER_UTILS.config.nft.multiple, component: MultiplePage },
    ],
  },
  { path: ROUTER_UTILS.config.nft.notFound, component: NotFoundPage },
  {
    path: ROUTER_UTILS.config.nft.nft,
    component: NFTPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NftRoutingModule {}
