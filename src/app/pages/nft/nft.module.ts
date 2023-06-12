import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CollapseModule } from '@components/collapse/collapse.module';
import { CollectionStatusModule } from '@components/collection/components/collection-status/collection-status.module';
import { ConfirmModalModule } from '@components/confirm-modal/confirm-modal.module';
import { ConnectWalletModule } from '@components/connect-wallet/connect-wallet.module';
import { CountdownModule } from '@components/countdown/countdown.module';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { IotaInputModule } from '@components/iota-input/iota-input.module';
import { NftBidModule } from '@components/nft/components/nft-bid/nft-bid.module';
import { NftCardModule } from '@components/nft/components/nft-card/nft-card.module';
import { NftCheckoutModule } from '@components/nft/components/nft-checkout/nft-checkout.module';
import { NftPreviewModule } from '@components/nft/components/nft-preview/nft-preview.module';
import { NftSaleModule } from '@components/nft/components/nft-sale/nft-sale.module';
import { RadioModule } from '@components/radio/radio.module';
import { ShareModule } from '@components/share/share.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { TimelineModule } from '@components/timeline/timeline.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { MarkDownModule } from '@core/pipes/markdown/markdown.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { StripMarkDownModule } from '@core/pipes/strip-markdown/strip-markdown.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NgChartsModule } from 'ng2-charts';
import { NftRoutingModule } from './nft-routing.module';
import { MultiplePage } from './pages/new/multiple/multiple.page';
import { NewPage } from './pages/new/new.page';
import { SinglePage } from './pages/new/single/single.page';
import { NFTPage } from './pages/nft/nft.page';
import { NotFoundPage } from './pages/not-found/not-found.page';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [NFTPage, NewPage, SinglePage, MultiplePage, NotFoundPage],
  imports: [
    CommonModule,
    NftRoutingModule,
    LayoutModule,
    NzButtonModule,
    CollectionStatusModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputNumberModule,
    IconModule,
    NzUploadModule,
    MarkDownModule,
    NftBidModule,
    NftCheckoutModule,
    StripMarkDownModule,
    ResizeAvatarModule,
    NzDatePickerModule,
    RadioModule,
    NzIconModule,
    NzInputModule,
    NzRadioModule,
    NzSelectModule,
    TabsModule,
    NzTagModule,
    NzAvatarModule,
    NzToolTipModule,
    NzSkeletonModule,
    TruncateModule,
    NftCardModule,
    NftPreviewModule,
    CollapseModule,
    NzTableModule,
    FormatTokenModule,
    TruncateModule,
    NzModalModule,
    ShareModule,
    NftSaleModule,
    CollapseModule,
    NgChartsModule,
    DescriptionModule,
    CountdownModule,
    TimelineModule,
    IotaInputModule,
    ConnectWalletModule,
    ConfirmModalModule,
  ],
  providers: [DataService],
})
export class NFTModule {}
