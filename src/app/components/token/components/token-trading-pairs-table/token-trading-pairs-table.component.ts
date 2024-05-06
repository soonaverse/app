import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { StorageItem, getItem, setItem } from '@core/utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { COL, Timestamp } from '@buildcore/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-token-trading-pairs-table',
  templateUrl: './token-trading-pairs-table.component.html',
  styleUrls: ['./token-trading-pairs-table.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TokenTradingPairsTableComponent implements OnInit {
  @Input() limittedView = false;
  @Input() favouritesOnly = false;
  @Output() wenOnClose = new EventEmitter<void>();
  public favouritesFilter = false;
  public config: InstantSearchConfig;
  public favourites: string[] = [];

  constructor(
    public deviceService: DeviceService,
    public filterStorageService: FilterStorageService,
    public algoliaService: AlgoliaService,
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
    this.favourites = (getItem(StorageItem.FavouriteTokens) as string[]) || [];
  }

  public favouriteClick(tokenId: string): void {
    if (this.favourites?.includes(tokenId)) {
      this.favourites = this.favourites.filter((t) => t !== tokenId);
    } else {
      this.favourites = [...this.favourites, tokenId];
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
