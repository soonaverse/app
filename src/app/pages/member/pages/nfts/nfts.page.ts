import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NftApi } from '@api/nft.api';
import { defaultPaginationItems } from '@components/algolia/algolia.options';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/member/services/data.service';
import { COL, Member, Timestamp } from '@soonaverse/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { BehaviorSubject } from 'rxjs';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-nfts',
  templateUrl: './nfts.page.html',
  styleUrls: ['./nfts.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class NFTsPage implements OnInit {
  public config?: InstantSearchConfig;
  public paginationItems = defaultPaginationItems;
  public isDepositNftVisible = false;

  constructor(
    public deviceService: DeviceService,
    public cache: CacheService,
    public nftApi: NftApi,
    public filterStorageService: FilterStorageService,
    public cacheService: CacheService,
    public data: DataService,
    public readonly algoliaService: AlgoliaService,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params?.depositNft === 'true' || params?.depositNft === true) {
        this.isDepositNftVisible = true;
        this.cd.markForCheck();
      }
    });

    this.data.member$.pipe(untilDestroyed(this)).subscribe((m) => {
      if (m) {
        this.filterStorageService.memberNftsFitlers$.next({
          sortBy: 'nft_soldOn_desc',
          refinementList: {
            ...this.filterStorageService.memberNftsFitlers$.value.refinementList,
            owner: [m.uid],
          },
        });

        this.config = {
          indexName: COL.NFT,
          searchClient: this.algoliaService.searchClient,
          initialUiState: {
            nft: this.filterStorageService.memberNftsFitlers$.value,
          },
        };

        // Algolia change detection bug fix
        setInterval(() => this.cd.markForCheck(), 200);
      }
    });
  }

  public get loggedInMember$(): BehaviorSubject<Member | undefined> {
    return this.auth.member$;
  }

  public trackByUid(_index: number, item: any): number {
    return item.uid;
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      availableFrom: Timestamp.fromMillis(+algolia.availableFrom),
    }));
  }
}
