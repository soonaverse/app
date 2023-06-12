import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { defaultPaginationItems } from '@components/algolia/algolia.options';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { CollapseType } from '@components/collapse/collapse.component';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { SeoService } from '@core/services/seo';
import { UntilDestroy } from '@ngneat/until-destroy';
import { discoverSections } from '@pages/discover/pages/discover/discover.page';
import { COL, Timestamp } from '@soonaverse/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { Subject } from 'rxjs';
import { CacheService } from './../../../../@core/services/cache/cache.service';
import { FilterService } from './../../services/filter.service';

@UntilDestroy()
@Component({
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MembersPage implements OnInit {
  config: InstantSearchConfig;
  sections = discoverSections;
  paginationItems = defaultPaginationItems;
  reset$ = new Subject<void>();
  sortOpen = true;

  constructor(
    public filter: FilterService,
    public deviceService: DeviceService,
    public cache: CacheService,
    public filterStorageService: FilterStorageService,
    public readonly algoliaService: AlgoliaService,
    private seo: SeoService,
  ) {
    this.config = {
      indexName: COL.MEMBER,
      searchClient: this.algoliaService.searchClient,
      initialUiState: {
        member: this.filterStorageService.discoverMembersFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Discover - Members`,
      $localize`Be a part of the most vibrant and fastest growing communities in crypto. Use metamask to join in seconds.`,
    );
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      createdOn: Timestamp.fromMillis(+algolia.createdOn),
      updatedOn: Timestamp.fromMillis(+algolia.updatedOn),
      lastmodified: Timestamp.fromMillis(+algolia.lastmodified),

      spaces: !algolia.spaces
        ? null
        : Object.entries(algolia.spaces).forEach((key: any[]) => ({
            [key[0]]: {
              ...key[1],
              updateOn: Timestamp.fromMillis(+key[1].updateOn),
              createOn: Timestamp.fromMillis(+key[1].createOn),
            },
          })),
    }));
  }

  public get collapseTypes(): typeof CollapseType {
    return CollapseType;
  }
}
