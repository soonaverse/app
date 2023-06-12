import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { CollectionPage } from './pages/collection/collection.page';
import { UpsertPage } from './pages/upsert/upsert.page';

const routes: Routes = [
  {
    path: ROUTER_UTILS.config.collection.new,
    component: UpsertPage,
  },
  {
    path: ROUTER_UTILS.config.collection.edit,
    component: UpsertPage,
  },
  {
    path: ROUTER_UTILS.config.collection.collection,
    component: CollectionPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionRoutingModule {}
