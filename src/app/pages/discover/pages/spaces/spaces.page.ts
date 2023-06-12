import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { defaultPaginationItems } from '@components/algolia/algolia.options';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { CollapseType } from '@components/collapse/collapse.component';
import { DeviceService } from '@core/services/device';
import { FilterStorageService } from '@core/services/filter-storage';
import { SeoService } from '@core/services/seo';
import { UntilDestroy } from '@ngneat/until-destroy';
import { discoverSections } from '@pages/discover/pages/discover/discover.page';
import { COL, Timestamp } from '@build-5/interfaces';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';
import { Subject } from 'rxjs';
import { FilterService } from './../../services/filter.service';

export enum HOT_TAGS {
  ALL = 'All',
  OPEN = 'Open',
}

@UntilDestroy()
@Component({
  templateUrl: './spaces.page.html',
  styleUrls: ['./spaces.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SpacesPage implements OnInit {
  config: InstantSearchConfig;
  sections = discoverSections;
  paginationItems = defaultPaginationItems;
  reset$ = new Subject<void>();
  sortOpen = true;

  constructor(
    public filter: FilterService,
    public deviceService: DeviceService,
    public filterStorageService: FilterStorageService,
    public readonly algoliaService: AlgoliaService,
    private seo: SeoService,
  ) {
    this.config = {
      indexName: COL.SPACE,
      searchClient: this.algoliaService.searchClient,
      initialUiState: {
        space: this.filterStorageService.discoverSpacesFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Discover - Spaces`,
      $localize`Sign up in minutes with our 1-click set up DAO-on-Demand. Fee-less on chain voting. Discover all of the amazing DAO's on the Soonaverse.`,
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
      endDate: algolia.endDate ? Timestamp.fromMillis(+algolia.endDate) : null,
    }));
  }

  public get collapseTypes(): typeof CollapseType {
    return CollapseType;
  }
}
