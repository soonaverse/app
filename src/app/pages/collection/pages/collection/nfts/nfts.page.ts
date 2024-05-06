import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
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
import { COL, Timestamp, Collection } from '@buildcore/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { Subject, take, filter, takeUntil } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
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
  ) {}

  public ngOnInit(): void {
    this.collectionNftStateService.availableNftsCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.availableNftsCount = count;
        this.cd.markForCheck();
      });

    if (this.collectionId) {
      this.loadCollection(this.collectionId);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.collectionId) {
      this.resetComponentState();
      if (this.collectionId) {
        this.loadCollection(this.collectionId);
      }
    }
  }

  private resetComponentState(): void {
    this.availableNftsCount = 0;
    this.sweepCount = 1;
    this.cd.markForCheck();
  }

  private loadCollection(collectionId: string): void {
    this.collectionApi
      .getCollectionById(collectionId)
      .pipe(take(1))
      .subscribe({
        next: (collectionData) => {
          if (collectionData) {
            this.collection = collectionData;
            this.initializeAlgoliaFilters(collectionId);
          } else {
            this.notification.error($localize`Error occurred while fetching collection.`, '');
          }
        },
        error: (err) => {
          this.notification.error($localize`Error occurred while fetching collection.`, '');
        },
      });
  }

  private initializeAlgoliaFilters(collectionId: string): void {
    this.filterStorageService.marketNftsFilters$.next({
      ...this.filterStorageService.marketNftsFilters$.value,
      refinementList: {
        ...this.filterStorageService.marketNftsFilters$.value.refinementList,
        collection: [collectionId],
      },
    });

    this.config = {
      indexName: COL.NFT,
      searchClient: this.algoliaService.searchClient,
      initialUiState: {
        nft: this.filterStorageService.marketNftsFilters$.value,
      },
    };

    this.cd.markForCheck();
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
    if (this.originalNfts.length !== algoliaItems.length && algoliaItems.length > 0) {
      this.captureOriginalHits(algoliaItems);
    }

    const transformedItems = algoliaItems.map((algolia) => ({
      ...algolia,
      availableFrom: Timestamp.fromMillis(+algolia.availableFrom),
    }));

    this.cd.markForCheck();

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

    this.collectionApi
      .getCollectionById(this.collectionId)
      .pipe(
        take(1),
        filter((collection): collection is Collection => Boolean(collection)),
        switchMap((collection) => {
          // Ensure we're working with a defined collection
          if (!collection) {
            throw new Error('Collection is undefined after filtering');
          }
          return this.collectionNftStateService.getListedNftsObservable(collection).pipe(
            map((nftsForSale) => nftsForSale.slice(0, Math.min(count, nftsForSale.length))),
            map((nftsToAdd) => ({ nftsToAdd, collection })),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ({ nftsToAdd, collection }) => {
          nftsToAdd.forEach((nft) => {
            this.cartService.addToCart(nft, collection, 1, true);
          });
          this.notification.success(
            $localize`NFTs swept into your cart, open cart to review added items.`,
            '',
          );
        },
        error: (error) =>
          this.notification.error($localize`Error occurred while adding NFTs to cart.`, ''),
      });

    this.cd.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
