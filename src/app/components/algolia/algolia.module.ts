import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RefinementListComponent } from '@components/algolia/refinement/refinement.component';
import { SearchBoxComponent } from '@components/algolia/search/search.component';
import { SortByComponent } from '@components/algolia/sort/sort.component';
import { VisibleDirective } from '@components/algolia/visible.directive';
import { CollectionCardModule } from '@components/collection/components/collection-card/collection-card.module';
import { DropdownTabsModule } from '@components/dropdown-tabs/dropdown-tabs.module';
import { IconModule } from '@components/icon/icon.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { NftCardModule } from '@components/nft/components/nft-card/nft-card.module';
import { RadioModule } from '@components/radio/radio.module';
import { SelectSpaceModule } from '@components/space/components/select-space/select-space.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { TokenRowModule } from '@components/token/components/token-row/token-row.module';
import { NgAisModule } from 'angular-instantsearch';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AlgoliaCheckboxComponent } from './algolia-checkbox/algolia-checkbox.component';
import { AlgoliaClearComponent } from './algolia-clear/algolia-clear.component';
import { AlgoliaHiddenDatePastComponent } from './algolia-hidden-date/algolia-hidden-date-past.component';
import { AlgoliaRadioComponent } from './algolia-radio/algolia-radio.component';
import { AlgoliaRangeComponent } from './algolia-range/algolia-range.component';
import { AlgoliaToggleComponent } from './algolia-toggle/algolia-toggle.component';
import { AlgoliaService } from './services/algolia.service';

@NgModule({
  imports: [
    HttpClientModule,
    NzNotificationModule,
    CommonModule,
    NzCardModule,
    NzInputModule,
    DropdownTabsModule,
    MobileSearchModule,
    TabsModule,
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
    NgAisModule,
    NzCollapseModule,
    TokenRowModule,
    NzRadioModule,
    RadioModule,
    NzAvatarModule,
    NzCheckboxModule,
    NzSliderModule,
    NzSwitchModule,
    NgAisModule.forRoot(),
  ],
  declarations: [
    SearchBoxComponent,
    SortByComponent,
    RefinementListComponent,
    VisibleDirective,
    AlgoliaHiddenDatePastComponent,
    AlgoliaRadioComponent,
    AlgoliaCheckboxComponent,
    AlgoliaRangeComponent,
    AlgoliaClearComponent,
    AlgoliaToggleComponent,
  ],
  providers: [AlgoliaService],
  exports: [
    SearchBoxComponent,
    SortByComponent,
    RefinementListComponent,
    NgAisModule,
    NzCollapseModule,
    VisibleDirective,
    AlgoliaRadioComponent,
    AlgoliaCheckboxComponent,
    AlgoliaRangeComponent,
    AlgoliaClearComponent,
    AlgoliaToggleComponent,
    AlgoliaHiddenDatePastComponent,
  ],
})
export class AlgoliaModule {}
