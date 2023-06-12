import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlgoliaModule } from '@components/algolia/algolia.module';
import { BadgeModule } from '@components/badge/badge.module';
import { CollapseModule } from '@components/collapse/collapse.module';
import { CollectionMintNetworkModule } from '@components/collection/components/collection-mint-network/collection-mint-network.module';
import { CollectionStatusModule } from '@components/collection/components/collection-status/collection-status.module';
import { DrawerToggleModule } from '@components/drawer-toggle/drawer-toggle.module';
import { DrawerModule } from '@components/drawer/drawer.module';
import { IconModule } from '@components/icon/icon.module';
import { IotaInputModule } from '@components/iota-input/iota-input.module';
import { NftCardModule } from '@components/nft/components/nft-card/nft-card.module';
import { RadioModule } from '@components/radio/radio.module';
import { SelectSpaceModule } from '@components/space/components/select-space/select-space.module';
import { OnVisibleModule } from '@core/directives/on-visible/on-visible.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { IpfsBadgeModule } from '@core/pipes/ipfs-badge/ipfs-badge.module';
import { MarkDownModule } from '@core/pipes/markdown/markdown.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { FilterService } from '@pages/market/services/filter.service';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AuditOneModule } from 'src/app/service-modules/audit-one/audit-one.module';
import { CollectionRoutingModule } from './collection-routing.module';
import { CollectionAboutComponent } from './pages/collection/collection-about/collection-about.component';
import { CollectionPage } from './pages/collection/collection.page';
import { CollectionNFTsPage } from './pages/collection/nfts/nfts.page';
import { UpsertPage } from './pages/upsert/upsert.page';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [CollectionPage, UpsertPage, CollectionAboutComponent, CollectionNFTsPage],
  imports: [
    AlgoliaModule,
    InfiniteScrollModule,
    CommonModule,
    CollectionRoutingModule,
    LayoutModule,
    NzDatePickerModule,
    ResizeAvatarModule,
    CollectionStatusModule,
    NzButtonModule,
    FormsModule,
    CollapseModule,
    DrawerModule,
    NzDrawerModule,
    FormatTokenModule,
    NzInputNumberModule,
    SelectSpaceModule,
    ReactiveFormsModule,
    NzCardModule,
    MarkDownModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    TruncateModule,
    IconModule,
    NzTypographyModule,
    NzUploadModule,
    NzSelectModule,
    RadioModule,
    NzRadioModule,
    NzIconModule,
    NzAvatarModule,
    BadgeModule,
    NzDrawerModule,
    IconModule,
    DrawerToggleModule,
    NzTagModule,
    NzSkeletonModule,
    NftCardModule,
    OnVisibleModule,
    InfiniteScrollModule,
    NzToolTipModule,
    AuditOneModule,
    NzCheckboxModule,
    IpfsBadgeModule,
    IotaInputModule,
    CollectionMintNetworkModule,
  ],
  providers: [DataService, FilterService],
})
export class CollectionModule {}
