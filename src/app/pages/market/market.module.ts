import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlgoliaModule } from '@components/algolia/algolia.module';
import { CollapseModule } from '@components/collapse/collapse.module';
import { CollectionCardModule } from '@components/collection/components/collection-card/collection-card.module';
import { CollectionHighlightCardModule } from '@components/collection/components/collection-highlight-card/collection-highlight-card.module';
import { DrawerModule } from '@components/drawer/drawer.module';
import { DropdownTabsModule } from '@components/dropdown-tabs/dropdown-tabs.module';
import { IconModule } from '@components/icon/icon.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { NftCardModule } from '@components/nft/components/nft-card/nft-card.module';
import { SelectSpaceModule } from '@components/space/components/select-space/select-space.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { TokenRowModule } from '@components/token/components/token-row/token-row.module';
import { OnVisibleModule } from '@core/directives/on-visible/on-visible.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MarketRoutingModule } from './market-routing.module';
import { CollectionsPage } from './pages/collections/collections.page';
import { MarketPage } from './pages/market/market.page';
import { FilterService } from './services/filter.service';

@NgModule({
  declarations: [MarketPage, CollectionsPage],
  imports: [
    CommonModule,
    MarketRoutingModule,
    NzCardModule,
    LayoutModule,
    OnVisibleModule,
    NzInputModule,
    DropdownTabsModule,
    MobileSearchModule,
    TabsModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    IconModule,
    SelectSpaceModule,
    CollectionCardModule,
    InfiniteScrollModule,
    NzSkeletonModule,
    NftCardModule,
    TokenRowModule,
    AlgoliaModule,
    NzButtonModule,
    CollapseModule,
    NzDrawerModule,
    NzSliderModule,
    DrawerModule,
    CollectionHighlightCardModule,
  ],
  providers: [FilterService],
})
export class MarketModule {}
