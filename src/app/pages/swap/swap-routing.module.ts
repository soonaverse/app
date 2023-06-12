import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SwapPage } from './pages/market/swap.page';

const routes: Routes = [
  {
    path: '',
    component: SwapPage,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SwapRoutingModule {}
