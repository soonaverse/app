import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { SwapPage } from './pages/market/swap.page';
import { SwapRoutingModule } from './swap-routing.module';

@NgModule({
  declarations: [SwapPage],
  imports: [
    CommonModule,
    SwapRoutingModule,
    NzCardModule,
    RouterModule,
    LayoutModule,
    NzButtonModule,
  ],
  providers: [],
})
export class SwapModule {}
