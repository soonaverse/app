import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NftSelectionToolbarComponent } from './nft-selection-toolbar.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NftTransferModule } from '@components/nft/components/nft-transfer/nft-transfer.module';
import { IconModule } from '@components/icon/icon.module';

@NgModule({
  declarations: [NftSelectionToolbarComponent],
  imports: [CommonModule, NzButtonModule, NzModalModule, NftTransferModule, IconModule],
  exports: [NftSelectionToolbarComponent],
})
export class NftSelectionToolbarModule {}
