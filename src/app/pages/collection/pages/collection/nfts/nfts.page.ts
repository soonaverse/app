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
  ) {}

  public ngOnInit(): void {
    console.log('ngOnInit fires');
    this.collectionNftStateService.availableNftsCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.availableNftsCount = count;
        console.log('[ngOnInit] this.availableNftsCount is set to count: ', count);
        this.cd.markForCheck();
      });

    if (this.collectionId) {
      this.loadCollection(this.collectionId);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges fires');
    if (changes.collectionId) {
      this.resetComponentState();
      if (this.collectionId) {
        this.loadCollection(this.collectionId);
      }
    }
  }

  private resetComponentState(): void {
    console.log('resetComponentState fires');
    this.availableNftsCount = 0;
    this.sweepCount = 1;
    this.cd.markForCheck();
  }

  private loadCollection(collectionId: string): void {
    console.log(`loadCollection fires for collectionId: ${collectionId}`);
    this.collectionApi
      .getCollectionById(collectionId)
      .pipe(take(1))
      .subscribe({
        next: (collectionData) => {
          console.log('Full response from getCollectionById:', collectionData);
          if (collectionData) {
            this.collection = collectionData;
            const listedNfts = this.collectionNftStateService.getListedNfts();
            if (this.originalNfts.length > 0 && listedNfts.length === 0) {
              this.collectionNftStateService.setListedNfts(this.originalNfts, this.collection);
            }
            this.initializeAlgoliaFilters(collectionId);
          }
        },
        error: (err) => {
          this.notification.error($localize`Error occurred while fetching collection.`, '');
        },
      });
  }

  private initializeAlgoliaFilters(collectionId: string): void {
    console.log('initializeAlgoliaFilters fires with collectionId: ', collectionId);

    console.log('Current filters:', this.filterStorageService.marketNftsFilters$.value);
    this.filterStorageService.marketNftsFilters$.next({
      ...this.filterStorageService.marketNftsFilters$.value,
      refinementList: {
        ...this.filterStorageService.marketNftsFilters$.value.refinementList,
        collection: [collectionId],
      },
    });
    console.log('Updated filters:', this.filterStorageService.marketNftsFilters$.value);

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
    console.log('captureOriginalHits fires');
    // console.log('[nfts.page-captureOriginalHits] function called with following hits (hits, this.collection): ', hits, this.collection);
    if (hits && hits.length > 0 && this.collection) {
      this.originalNfts = hits;
      this.collectionNftStateService.setListedNfts(hits, this.collection);
      // console.log('[nfts.page-captureOriginalHits] hits if passed, originalNfts set to hits and collectionNftStateService.setListedNfts given (hits, this.collection): ', hits, this.collection);
    }
  }

  public trackByUid(_index: number, item: any): number {
    return item.uid;
  }

  public convertAllToSoonaverseModel = (algoliaItems: any[]) => {
    console.log('convertAllToSoonaverseModel fires');
    // console.log('[nfts.page-convertAllToSoonaverseModel] function called with following algoliaItems: ', algoliaItems);
    if (this.originalNfts.length !== algoliaItems.length && algoliaItems.length > 0) {
      // console.log('[nfts.page-convertAllToSoonaverseModel] run captureOriginalHits since aligoliaItems and originalNfts lengths dont match, (alogliaItems.length, originalNfts.length): ', algoliaItems.length, this.originalNfts.length);
      this.captureOriginalHits(algoliaItems);
    }

    console.log('Before processing:', algoliaItems);
    const transformedItems = algoliaItems.map((algolia) => ({
      ...algolia,
      availableFrom: Timestamp.fromMillis(+algolia.availableFrom),
    }));
    console.log('After processing:', transformedItems);

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
    console.log('[nfts.page-sweepToCart] function called with following count: ', count);
    if (!this.collectionId) {
      this.notification.error($localize`Collection ID is not available.`, '');
      return;
    }

    this.collectionApi
      .getCollectionById(this.collectionId)
      .pipe(
        take(1),
        filter((collection): collection is Collection => collection !== undefined),
        switchMap((collection: Collection) => {
          const listedNfts = this.collectionNftStateService.getListedNfts();
          console.log(
            '[nfts.page-sweepToCart] listedNfts set to this.collectionNftStateService: ',
            listedNfts,
          );

          const nftsForSale = listedNfts.filter((nft) =>
            this.cartService.isNftAvailableForSale(nft, collection),
          );
          console.log(
            '[nfts.page-sweepToCart] nftsForSale set to filtered listedNfts that pass true for "isNftAvailableForSale", nftsForSale: ',
            nftsForSale,
          );

          const getEffectivePrice = (nft) => nft?.availablePrice || nft?.price || 0;

          const sortedNfts = nftsForSale.sort((a, b) => {
            const priceA = getEffectivePrice(a);
            const priceB = getEffectivePrice(b);
            return priceA - priceB;
          });
          console.log(
            '[nfts.page-sweepToCart] sortedNfts set to nftsToAdd sorted by "effective price" low to high, sortedNfts: ',
            sortedNfts,
          );

          const nftsToAdd = sortedNfts.slice(0, Math.min(count, sortedNfts.length));
          console.log(
            '[nfts.page-sweepToCart] nftsToAdd set to first N sorted NFTs based on price, nftsToAdd: ',
            nftsToAdd,
          );

          nftsToAdd.forEach((nft) => {
            const cartItem = { nft, collection, quantity: 1, salePrice: 0 };
            this.cartService.addToCart(cartItem);
          });

          this.notification.success(
            $localize`NFTs swept into your cart, open cart to review added items.`,
            '',
          );

          return nftsToAdd;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        error: (err) => {
          this.notification.error($localize`Error occurred while fetching collection.`, '');
        },
      });
  }

  public ngOnDestroy(): void {
    console.log('ngOnDestroy fires');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
