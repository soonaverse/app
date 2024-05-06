import { Component, OnInit } from '@angular/core';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { SeoService } from '@core/services/seo';
import { UntilDestroy } from '@ngneat/until-destroy';
import { COL, Timestamp } from '@buildcore/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { tokensSections } from '../tokens/tokens.page';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-all-tokens',
  templateUrl: './all-tokens.page.html',
  styleUrls: ['./all-tokens.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllTokensPage implements OnInit {
  public sections = tokensSections;
  public config: InstantSearchConfig;

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
        token: this.filterStorageService.tokensAllTokensFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Tokens`,
      $localize`Explore the top Shimmer, IOTA, and SOON cryptocurrencies. Price charts, crypto profiles, on a non-custodial, secure L1 exchange! Sign up today.`,
    );
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      createdOn: Timestamp.fromMillis(+algolia.createdOn),
      mintedClaimedOn: Timestamp.fromMillis(+algolia.mintedClaimedOn),
    }));
  }
}
