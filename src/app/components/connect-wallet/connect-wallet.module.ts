import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ConnectWalletComponent } from './connect-wallet.component';

@NgModule({
  declarations: [ConnectWalletComponent],
  imports: [CommonModule, IconModule],
  exports: [ConnectWalletComponent],
})
export class ConnectWalletModule {}
