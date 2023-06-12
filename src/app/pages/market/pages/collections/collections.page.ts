import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CollectionApi } from '@api/collection.api';
import { AlgoliaCheckboxFilterType } from '@components/algolia/algolia-checkbox/algolia-checkbox.component';
import { defaultPaginationItems } from '@components/algolia/algolia.options';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { CollapseType } from '@components/collapse/collapse.component';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { SeoService } from '@core/services/seo';
import { UntilDestroy } from '@ngneat/until-destroy';
import { marketSections } from '@pages/market/pages/market/market.page';
import { FilterService } from '@pages/market/services/filter.service';
import { COL, Timestamp } from '@soonaverse/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { Subject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-collections',
  templateUrl: './collections.page.html',
  styleUrls: ['./collections.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // TODO investigate how to bypass this....
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CollectionsPage implements OnInit {
  config: InstantSearchConfig;
  sections = marketSections;
  paginationItems = defaultPaginationItems;
  reset$ = new Subject<void>();
  sortOpen = true;
  saleFilterOpen = true;
  spaceFilterOpen = true;
  categoryFilterOpen = false;
  priceFilterOpen = false;

  constructor(
    public filter: FilterService,
    public collectionApi: CollectionApi,
    public deviceService: DeviceService,
    public filterStorageService: FilterStorageService,
    public readonly algoliaService: AlgoliaService,
    private seo: SeoService,
  ) {
    // this.filterStorageService.marketCollectionsFilters$.next({
    //   ...this.filterStorageService.marketCollectionsFilters$.value,
    //   refinementList: {
    //     ...this.filterStorageService.marketCollectionsFilters$.value.refinementList
    //   },
    //   availableFrom: {
    //     seconds: '0, 2000000000'
    //   }
    // });

    this.config = {
      indexName: COL.COLLECTION,
      searchClient: this.algoliaService.searchClient,
      initialUiState: {
        collection: this.filterStorageService.marketCollectionsFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Collections - NFT`,
      $localize`A completely fee-less Non-Fungible Tokens (NFTs) marketplace, digital collectibles, digital art, ownership rights, and more.`,
    );
  }

  public trackByUid(_index: number, item: any): number {
    return item.uid;
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      createdOn: Timestamp.fromMillis(+algolia.createdOn),
      updatedOn: Timestamp.fromMillis(+algolia.updatedOn),
      lastmodified: Timestamp.fromMillis(+algolia.lastmodified),
      availableFrom: Timestamp.fromMillis(+algolia.availableFrom),
    }));
  }

  public get collapseTypes(): typeof CollapseType {
    return CollapseType;
  }

  public get algoliaCheckboxFilterTypes(): typeof AlgoliaCheckboxFilterType {
    return AlgoliaCheckboxFilterType;
  }
}
