import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AlgoliaCheckboxFilterType } from '@components/algolia/algolia-checkbox/algolia-checkbox.component';
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
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
}

@UntilDestroy()
@Component({
  templateUrl: './awards.page.html',
  styleUrls: ['./awards.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AwardsPage implements OnInit {
  config: InstantSearchConfig;
  sections = discoverSections;
  paginationItems = defaultPaginationItems;
  reset$ = new Subject<void>();
  sortOpen = true;
  spaceFilterOpen = true;
  tokenFilterOpen = true;

  constructor(
    public filter: FilterService,
    public deviceService: DeviceService,
    public filterStorageService: FilterStorageService,
    public readonly algoliaService: AlgoliaService,
    private seo: SeoService,
  ) {
    this.config = {
      indexName: COL.AWARD,
      searchClient: this.algoliaService.searchClient,
      initialUiState: {
        award: this.filterStorageService.discoverAwardsFilters$.value,
      },
    };
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Discover - Awards`,
      $localize`Explore the best approach to DAO community engagement and growth. Awards, fee-less voting, 1-click set up. Join today.`,
    );
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public get algoliaCheckboxFilterTypes(): typeof AlgoliaCheckboxFilterType {
    return AlgoliaCheckboxFilterType;
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      createdOn: Timestamp.fromMillis(+algolia.createdOn),
      updatedOn: Timestamp.fromMillis(+algolia.updatedOn),
      lastmodified: Timestamp.fromMillis(+algolia.lastmodified),
      endDate: Timestamp.fromMillis(+algolia.endDate),
    }));
  }

  public get collapseTypes(): typeof CollapseType {
    return CollapseType;
  }
}
