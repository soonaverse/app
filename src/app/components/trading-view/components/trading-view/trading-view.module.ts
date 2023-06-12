import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TradingViewComponent } from './trading-view.component';

@NgModule({
  declarations: [TradingViewComponent],
  imports: [CommonModule, NzButtonModule, NzAvatarModule, TruncateModule],
  exports: [TradingViewComponent],
})
export class TradingViewModule {}
