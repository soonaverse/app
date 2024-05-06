import { Component, OnInit } from '@angular/core';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { SeoService } from '@core/services/seo';
import { StorageItem, getItem, setItem } from '@core/utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { COL, Timestamp, Token } from '@buildcore/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { tokensSections } from '../tokens/tokens.page';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-trading-pairs',
  templateUrl: './trading-pairs.page.html',
  styleUrls: ['./trading-pairs.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradingPairsPage implements OnInit {
  public sections = tokensSections;
  public config: InstantSearchConfig;
  public favourites: string[] = [];

  constructor(
    public deviceService: DeviceService,
    public filterStorageService: FilterStorageService,
    public algoliaService: AlgoliaService,
    private seo: SeoService,
  ) {
    this.config = {
      indexName: COL.TOKEN,
      searchClient: this.algoliaService.searchClient,
      initialUiState: {
        token: this.filterStorageService.tokensTradingPairsFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Tokens - Trading Pairs`,
      $localize`The most complete listing of Shimmer projects, SOON currency pairs and markets, on a non-custodial, secure L1 exchange. Sign up today!`,
    );

    this.favourites = (getItem(StorageItem.FavouriteTokens) as string[]) || [];
  }

  public favouriteClick(token: Token): void {
    if (this.favourites?.includes(token.uid)) {
      this.favourites = this.favourites.filter((t) => t !== token.uid);
    } else {
      this.favourites = [...this.favourites, token.uid];
    }

    setItem(StorageItem.FavouriteTokens, this.favourites);
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      createdOn: Timestamp.fromMillis(+algolia.createdOn),
      mintedClaimedOn: Timestamp.fromMillis(+algolia.mintedClaimedOn),
    }));
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }
}
