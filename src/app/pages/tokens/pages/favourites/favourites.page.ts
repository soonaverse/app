import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TokenApi } from '@api/token.api';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { getItem, setItem, StorageItem } from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Token } from '@buildcore/interfaces';
import { BehaviorSubject, combineLatest, map, Observable, Subscription } from 'rxjs';
import { tokensSections } from '../tokens/tokens.page';

@UntilDestroy()
@Component({
  selector: 'wen-favourites',
  templateUrl: './favourites.page.html',
  styleUrls: ['./favourites.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavouritesPage implements OnInit, OnDestroy {
  public tokens$: BehaviorSubject<Token[] | undefined> = new BehaviorSubject<Token[] | undefined>(
    undefined,
  );
  public favourites: string[] = [];
  public filteredTokens$: Observable<Token[] | undefined>;
  public filterControl: FormControl;
  public sections = tokensSections;
  public tradingPairsPath = ROUTER_UTILS.config.tokens.tradingPairs;
  private subscriptions$: Subscription[] = [];

  constructor(
    public deviceService: DeviceService,
    private tokenApi: TokenApi,
    private seo: SeoService,
  ) {
    this.filterControl = new FormControl('');

    this.filteredTokens$ = combineLatest([this.tokens$, this.filterControl.valueChanges]).pipe(
      map(([tokens, filter]) => {
        return tokens?.filter((r) => r.name.includes(filter || ''));
      }),
    );

    if (this.deviceService.isBrowser) {
      this.favourites = (getItem(StorageItem.FavouriteTokens) || []) as string[];
      setItem(StorageItem.FavouriteTokens, this.favourites);
    }
  }

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`Tokens - Favourite`,
      $localize`Buy, trade, and hold your favorite Shimmer, IOTA, and SOON tokens. Our non-custodial, secure L1 exchange is ready for you! Sign up today.`,
    );

    this.listen();
  }

  private listen(): void {
    this.cancelSubscriptions();
    this.tokens$.next(undefined);
    if (!this.favourites?.length) return;
    // We only support up to 10 favorities for now.
    // TODO Improve this and go away from using IN.
    this.subscriptions$.push(
      this.tokenApi.listenMultiple(this.favourites.slice(0, 10)).subscribe((tokens) => {
        this.tokens$.next(tokens);
        this.filterControl.setValue(this.filterControl.value);
      }),
    );
  }

  public isLoading(arr: any): boolean {
    return arr === undefined;
  }

  public isEmpty(arr: any): boolean {
    return Array.isArray(arr) && arr.length === 0;
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public favouriteClick(token: Token): void {
    if (this.favourites?.includes(token.uid)) {
      this.favourites = this.favourites.filter((t) => t !== token.uid);
    } else {
      this.favourites = [...this.favourites, token.uid];
    }

    setItem(StorageItem.FavouriteTokens, this.favourites);
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
