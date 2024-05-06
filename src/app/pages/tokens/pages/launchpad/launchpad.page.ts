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
  selector: 'wen-launchpad',
  templateUrl: './launchpad.page.html',
  styleUrls: ['./launchpad.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class LaunchpadPage implements OnInit {
  public config: InstantSearchConfig;
  public sections = tokensSections;

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
        token: this.filterStorageService.tokensLaunchpadFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Tokens - Launchpad`,
      $localize`Raise funds, build your following, grow your audience, and LAUNCH your Shimmer tokens with the Soonaverse Launchpad. Join today.`,
    );
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
