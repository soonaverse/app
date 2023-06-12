import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { PoolPage } from './pages/market/pool.page';
import { PoolRoutingModule } from './pool-routing.module';

@NgModule({
  declarations: [PoolPage],
  imports: [
    CommonModule,
    PoolRoutingModule,
    NzCardModule,
    RouterModule,
    LayoutModule,
    NzButtonModule,
  ],
  providers: [],
})
export class PoolModule {}
