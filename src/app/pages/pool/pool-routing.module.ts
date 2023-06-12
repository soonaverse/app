import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PoolPage } from './pages/market/pool.page';

const routes: Routes = [
  {
    path: '',
    component: PoolPage,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoolRoutingModule {}
