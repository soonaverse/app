import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { WalletDeeplinkComponent } from './wallet-deeplink.component';

@NgModule({
  declarations: [WalletDeeplinkComponent],
  imports: [CommonModule, NzButtonModule],
  exports: [WalletDeeplinkComponent],
})
export class WalletDeeplinkModule {}
