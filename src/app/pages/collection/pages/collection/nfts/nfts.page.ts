import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { NftApi } from '@api/nft.api';
import { CollectionApi } from '@api/collection.api';
import { AlgoliaCheckboxFilterType } from '@components/algolia/algolia-checkbox/algolia-checkbox.component';
import { defaultPaginationItems } from '@components/algolia/algolia.options';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { CollapseType } from '@components/collapse/collapse.component';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { UntilDestroy } from '@ngneat/until-destroy';
import { marketSections } from '@pages/market/pages/market/market.page';
import { FilterService } from '@pages/market/services/filter.service';
import { COL, Timestamp, Collection } from '@build-5/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { Subject, take, filter, takeUntil } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CartService } from '@components/cart/services/cart.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { state } from '@angular/animations';

import { CollectionNftStateService } from './collectionNfts.service';

// used in src/app/pages/collection/pages/collection/collection.page.ts
export enum HOT_TAGS {
  ALL = 'All',
  PENDING = 'Pending',
  AVAILABLE = 'Available',
  AUCTION = 'On Auction',
  OWNED = 'Owned',
  SPACE = 'SPACE',
}

@UntilDestroy()
@Component({
  selector: 'wen-collection-nfts',
  templateUrl: './nfts.page.html',
  styleUrls: ['./nfts.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // TODO investigate how to bypass this....
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CollectionNFTsPage implements OnInit, OnChanges, OnDestroy {
  @Input() public collectionId?: string | null;
  config?: InstantSearchConfig;
  sections = marketSections;
  paginationItems = defaultPaginationItems;
  reset$ = new Subject<void>();
  sortOpen = true;
  statusFilterOpen = true;
  spaceFilterOpen = true;
  collectionFilterOpen = true;
  priceFilterOpen = false;
  sweepCount = 1;
  originalNfts: any[] = [];
  private destroy$ = new Subject<void>();
  availableNftsCount = 0;
  collection: Collection | null = null;

  constructor(
    public filter: FilterService,
    public deviceService: DeviceService,
    public nftApi: NftApi,
    private collectionApi: CollectionApi,
    public cd: ChangeDetectorRef,
    public filterStorageService: FilterStorageService,
    public cacheService: CacheService,
    public readonly algoliaService: AlgoliaService,
    public cartService: CartService,
    private notification: NzNotificationService,
    private collectionNftStateService: CollectionNftStateService,
  ) { }

  public ngOnInit(): void {
    if (this.collectionId) {
      this.collectionApi.getCollectionById(this.collectionId)
        .pipe(take(1))
        .subscribe({
          next: (collectionData) => {
            if (collectionData) {
              this.collection = collectionData;
              this.collectionNftStateService.setListedNfts(this.originalNfts, this.collection);
            }
          },
          error: err => {
            // console.error('Error fetching collection:', err);
            this.notification.error($localize`Error occurred while fetching collection.`, '');
          }
        });
    }

    this.collectionNftStateService.availableNftsCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.availableNftsCount = count;
      });

    // Algolia change detection bug fix
    setInterval(() => this.cd.markForCheck(), 500);
  }

  public ngOnChanges(): void {
    // TODO comeup with better process.
    setTimeout(() => {
      if (this.collectionId) {
        this.filterStorageService.marketNftsFilters$.next({
          ...this.filterStorageService.marketNftsFilters$.value,
          refinementList: {
            ...this.filterStorageService.marketNftsFilters$.value.refinementList,
            collection: [this.collectionId],
          },
        });

        this.config = {
          indexName: COL.NFT,
          searchClient: this.algoliaService.searchClient,
          initialUiState: {
            nft: this.filterStorageService.marketNftsFilters$.value,
          },
        };
      }
    }, 500);
  }

  public captureOriginalHits(hits: any[]) {
    if (hits && hits.length > 0 && this.collection) {
      this.originalNfts = hits;
      this.collectionNftStateService.setListedNfts(hits, this.collection);
    }
  }

  public trackByUid(_index: number, item: any): number {
    return item.uid;
  }

  public convertAllToSoonaverseModel = (algoliaItems: any[]) => {
    this.captureOriginalHits(algoliaItems);

    const transformedItems = algoliaItems.map((algolia) => ({
      ...algolia,
      availableFrom: Timestamp.fromMillis(+algolia.availableFrom),
    }));
    return transformedItems;
  };

  public get collapseTypes(): typeof CollapseType {
    return CollapseType;
  }

  public get algoliaCheckboxFilterTypes(): typeof AlgoliaCheckboxFilterType {
    return AlgoliaCheckboxFilterType;
  }

  public sweepToCart(count: number) {
    if (!this.collectionId) {
      this.notification.error($localize`Collection ID is not available.`, '');
      return;
    }

    this.collectionApi.getCollectionById(this.collectionId)
      .pipe(
        take(1),
        filter((collection): collection is Collection => collection !== undefined),
        switchMap((collection: Collection) => {
          const listedNfts = this.collectionNftStateService.getListedNfts();

          const nftsForSale = listedNfts.filter(nft =>
            this.cartService.isNftAvailableForSale(nft, collection)
          );

          const nftsToAdd = nftsForSale
            .slice(0, Math.min(count, 20))
            .sort((a, b) => {
              const priceA = a.availablePrice != null ? a.availablePrice : 0;
              const priceB = b.availablePrice != null ? b.availablePrice : 0;
              return priceA - priceB;
            });

          nftsToAdd.forEach(nft => {
            const cartItem = { nft, collection, quantity: 1, salePrice: 0 };
            this.cartService.addToCart(cartItem);
          });

          this.notification.success($localize`NFTs swept into your cart, open cart to review added items.`, '');

          return nftsToAdd;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: err => {
          this.notification.error($localize`Error occurred while fetching collection.`, '');
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
