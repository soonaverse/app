import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TokenApi } from '@api/token.api';
import { FavouritesIconComponent } from '@components/icon/favourites/favourites.component';
import { TabSection } from '@components/tabs/tabs.component';
import { DeviceService } from '@core/services/device';
import { StorageItem, getItem, setItem } from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Token } from '@buildcore/interfaces';
import { filter } from 'rxjs';

export const tokensSections: TabSection[] = [
  {
    route: `../${ROUTER_UTILS.config.tokens.favourites}`,
    label: $localize`Favorites`,
    icon: FavouritesIconComponent,
  },
  { route: `../${ROUTER_UTILS.config.tokens.allTokens}`, label: $localize`All tokens` },
  { route: `../${ROUTER_UTILS.config.tokens.tradingPairs}`, label: $localize`Trading pairs` },
  { route: `../${ROUTER_UTILS.config.tokens.launchpad}`, label: $localize`Launchpad` },
];

const HIGHLIGHT_TOKENS =
  environment.production === false
    ? ['0xf0ae0ebc9c300657168a2fd20653799fbbfc3b48', '0x7eff2c7271851418f792daffe688e662a658950d']
    : ['0xf0ae0ebc9c300657168a2fd20653799fbbfc3b48', '0x9600b5afbb84f15e0d4c0f90ea60b2b8d7bd0f1e'];

@UntilDestroy()
@Component({
  selector: 'wen-tokens',
  templateUrl: './tokens.page.html',
  styleUrls: ['./tokens.page.less'],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TokensPage implements OnInit {
  public isMigrationWarningVisible = false;
  public highlightTokens: Token[] = [];
  public recentlyListedTokens: Token[] = [];

  constructor(
    public deviceService: DeviceService,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);
    this.handleMigrationWarning();
    this.listenToHighlightTokens();
    this.listenToRecentlyListedTokens();

    if (this.deviceService.isBrowser) {
      const routeSplit: string[] = this.router.url.split('/');
      if (
        ((getItem(StorageItem.FavouriteTokens) as string[]) || [])?.length &&
        (routeSplit.length === 2 || routeSplit[2] === ROUTER_UTILS.config.tokens.favourites)
      ) {
        this.router.navigate([
          '/',
          ROUTER_UTILS.config.tokens.root,
          ROUTER_UTILS.config.tokens.favourites,
        ]);
      } else if (routeSplit.length === 2) {
        this.router.navigate([
          '/',
          ROUTER_UTILS.config.tokens.root,
          ROUTER_UTILS.config.tokens.allTokens,
        ]);
      }
    }
  }

  public understandMigrationWarning(): void {
    setItem(StorageItem.TokenMigrationWarningClosed, true);
    this.isMigrationWarningVisible = false;
    this.cd.markForCheck();
  }

  private handleMigrationWarning(): void {
    const migrationWarningClosed = getItem(StorageItem.TokenMigrationWarningClosed);
    if (!migrationWarningClosed) {
      this.isMigrationWarningVisible = true;
    }
    this.cd.markForCheck();
  }

  private listenToHighlightTokens(): void {
    this.tokenApi
      .listenMultiple(HIGHLIGHT_TOKENS)
      .pipe(
        filter((r: any) => r.every((token) => token)),
        untilDestroyed(this),
      )
      .subscribe((r) => {
        this.highlightTokens = r as Token[];
        this.cd.markForCheck();
      });
  }

  private listenToRecentlyListedTokens(): void {
    this.tokenApi
      .topPublic(undefined, 2)
      .pipe(untilDestroyed(this))
      .subscribe((r) => {
        this.recentlyListedTokens = r;
        this.cd.markForCheck();
      });
  }
}
