import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CollectionHighlightCardType } from '@components/collection/components/collection-highlight-card/collection-highlight-card.component';
import { TabSection } from '@components/tabs/tabs.component';
import { DeviceService } from '@core/services/device';
import { getItem, setItem, StorageItem } from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { environment } from '@env/environment';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FilterService } from '../../services/filter.service';

export const marketSections = [
  { route: `../${ROUTER_UTILS.config.market.collections}`, label: $localize`Collections` },
  { route: `../${ROUTER_UTILS.config.market.nfts}`, label: $localize`NFTs` },
];

const HIGHLIGHT_COLLECTIONS =
  environment.production === false
    ? ['0x8fb5ee76d99fe3ac46311f4a021d7c12c3267754', '0x531b6bbb3d34655b3d842876fe6c8f444e8dd3f1']
    : ['0xcbe28532602d67eec7c937c0037509d426f38223', '0xdb47fa3d6cdc14910933d0074fba36a396771bfa'];

@UntilDestroy()
@Component({
  selector: 'wen-market',
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // TODO investigate how to bypass this....
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MarketPage implements OnInit {
  public sections: TabSection[] = [
    { route: ROUTER_UTILS.config.market.collections, label: $localize`Collections` },
    { route: ROUTER_UTILS.config.market.nfts, label: $localize`NFTs` },
  ];
  public isSearchInputFocused = false;
  public isMigrationWarningVisible = false;

  constructor(
    public filter: FilterService,
    public deviceService: DeviceService,
    private cd: ChangeDetectorRef,
  ) {
    // none;
  }

  public ngOnInit(): void {
    this.handleMigrationWarning();
    this.deviceService.viewWithSearch$.next(true);
  }

  public get collectionHighlightCardTypes(): typeof CollectionHighlightCardType {
    return CollectionHighlightCardType;
  }

  public understandMigrationWarning(): void {
    setItem(StorageItem.CollectionMigrationWarningClosed, true);
    this.isMigrationWarningVisible = false;
    this.cd.markForCheck();
  }

  private handleMigrationWarning(): void {
    const migrationWarningClosed = getItem(StorageItem.CollectionMigrationWarningClosed);
    if (!migrationWarningClosed) {
      this.isMigrationWarningVisible = true;
    }
    this.cd.markForCheck();
  }
}
