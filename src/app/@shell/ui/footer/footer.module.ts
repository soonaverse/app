import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FooterComponent } from './footer.component';
import { NftSelectionToolbarModule } from '@components/nft/components/nft-selection-toolbar/nft-selection-toolbar.module';

@NgModule({
  declarations: [FooterComponent],
  imports: [
    CommonModule,
    NftSelectionToolbarModule,
  ],
  exports: [FooterComponent],
})
export class FooterModule {}
