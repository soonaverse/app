import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FileApi } from '@api/file.api';
import { SpaceApi } from '@api/space.api';
import { TokenApi } from '@api/token.api';
import { TokenMarketApi } from '@api/token_market.api';
import { TokenPurchaseApi } from '@api/token_purchase.api';
import { AuthService } from '@components/auth/services/auth.service';
import { TRADING_VIEW_INTERVALS } from '@components/trading-view/components/trading-view/trading-view.component';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { SeoService } from '@core/services/seo';
import { UnitsService } from '@core/services/units';
import { StorageItem, getItem, setItem } from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/token/services/data.service';
import { HelperService } from '@pages/token/services/helper.service';
import {
  DEFAULT_NETWORK,
  DEFAULT_NETWORK_DECIMALS,
  FILE_SIZES,
  Member,
  NETWORK_DETAIL,
  SERVICE_MODULE_FEE_TOKEN_EXCHANGE,
  Space,
  Timestamp,
  Token,
  TokenDistribution,
  TokenPurchase,
  TokenStatus,
  TokenTradeOrder,
  TokenTradeOrderStatus,
  TokenTradeOrderType,
  getDefDecimalIfNotSet,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import bigDecimal from 'js-big-decimal';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  filter,
  first,
  interval,
  map,
  merge,
  of,
  skip,
  take,
} from 'rxjs';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export enum AskListingType {
  OPEN = 'OPEN',
  MY = 'MY',
}

export enum BidListingType {
  OPEN = 'OPEN',
  MY = 'MY',
}

export enum MyTradingType {
  BIDS = 'BIDS',
  ASKS = 'ASKS',
  HISTORY = 'HISTORY',
}

export enum TradeFormState {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum PriceOptionType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export enum MobileViewState {
  ORDER_BOOK = 'ORDER_BOOK',
  TOKEN_CHART = 'TOKEN_CHART',
  TRADE_HISTORY = 'TRADE_HISTORY',
}

export interface TransformedBidAskItem {
  price: number;
  amount: number;
  isOwner: boolean;
}

export const ORDER_BOOK_OPTIONS = [0.1, 0.01, 0.001];
const MAXIMUM_ORDER_BOOK_ROWS = 9;

@UntilDestroy()
@Component({
  selector: 'wen-trade',
  templateUrl: './trade.page.html',
  styleUrls: ['./trade.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradePage implements OnInit, OnDestroy {
  public chartLengthOptions = [
    // { label: $localize`5m`, value: TRADING_VIEW_INTERVALS['5m'] },
    { label: $localize`1h`, value: TRADING_VIEW_INTERVALS['1h'] },
    { label: $localize`4h`, value: TRADING_VIEW_INTERVALS['4h'] },
    { label: $localize`1d`, value: TRADING_VIEW_INTERVALS['1d'] },
    { label: $localize`1w`, value: TRADING_VIEW_INTERVALS['1w'] },
  ];
  public bids$: BehaviorSubject<TokenTradeOrder[]> = new BehaviorSubject<TokenTradeOrder[]>([]);
  public myBids$: BehaviorSubject<TokenTradeOrder[]> = new BehaviorSubject<TokenTradeOrder[]>([]);
  public asks$: BehaviorSubject<TokenTradeOrder[]> = new BehaviorSubject<TokenTradeOrder[]>([]);
  public myAsks$: BehaviorSubject<TokenTradeOrder[]> = new BehaviorSubject<TokenTradeOrder[]>([]);
  public sortedBids$ = new BehaviorSubject<TransformedBidAskItem[]>([] as TransformedBidAskItem[]);
  public sortedAsks$ = new BehaviorSubject<TransformedBidAskItem[]>([] as TransformedBidAskItem[]);
  public bidsAmountHighest$: Observable<number>;
  public asksAmountHighest$: Observable<number>;
  public myOpenBids$: Observable<TokenTradeOrder[]>;
  public myOpenAsks$: Observable<TokenTradeOrder[]>;
  public myOrderHistory$: Observable<TokenTradeOrder[]>;
  public buySellPriceDiff$: Observable<number> = of(0);
  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public listenAvgPrice$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenAvgPrice7d$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenChangePrice24h$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public tradeHistory$: BehaviorSubject<TokenPurchase[]> = new BehaviorSubject<TokenPurchase[]>([]);
  public chartLengthControl: FormControl = new FormControl(
    TRADING_VIEW_INTERVALS['1h'],
    Validators.required,
  );
  public memberDistribution$?: BehaviorSubject<TokenDistribution | undefined> = new BehaviorSubject<
    TokenDistribution | undefined
  >(undefined);
  public currentAskListing = AskListingType.OPEN;
  public currentBidsListing = BidListingType.OPEN;
  public currentMyTradingState = MyTradingType.BIDS;
  public currentMobileViewState = MobileViewState.ORDER_BOOK;
  public currentTradeFormState$ = new BehaviorSubject<TradeFormState>(TradeFormState.BUY);
  public isFavourite = false;
  public pairModalVisible = false;
  public loadPairsModal = false;
  public orderBookOptions = ORDER_BOOK_OPTIONS;
  public orderBookOptionControl = new FormControl(ORDER_BOOK_OPTIONS[2]);
  public orderBookOption$: BehaviorSubject<number> = new BehaviorSubject<number>(
    ORDER_BOOK_OPTIONS[2],
  );
  public currentDate = dayjs();
  public defaultNetwork = DEFAULT_NETWORK;
  public maximumOrderBookRows = MAXIMUM_ORDER_BOOK_ROWS;
  public priceOption$ = new BehaviorSubject<PriceOptionType>(PriceOptionType.LIMIT);
  public amountControl: FormControl = new FormControl();
  public priceControl: FormControl = new FormControl();
  public dummyControl = new FormControl({ value: undefined, disabled: true });
  public isBidTokenOpen = false;
  public isAskTokenOpen = false;
  public cancelTradeOrder: TokenTradeOrder | null = null;
  public tradeDetailOrder: TokenTradeOrder | null = null;
  public tradeDetailPurchases: TokenPurchase[] | TokenPurchase | null = null;
  public isTradeDrawerVisible = false;
  private subscriptions$: Subscription[] = [];
  private subscriptionsMembersBids$: Subscription[] = [];
  private memberDistributionSub$?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public data: DataService,
    public auth: AuthService,
    public cache: CacheService,
    public helper: HelperService,
    public unitsService: UnitsService,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
    private tokenPurchaseApi: TokenPurchaseApi,
    private notification: NotificationService,
    private tokenMarketApi: TokenMarketApi,
    private spaceApi: SpaceApi,
    private route: ActivatedRoute,
    private seo: SeoService,
    private fileApi: FileApi,
  ) {
    this.bidsAmountHighest$ = this.sortedBids$
      .asObservable()
      .pipe(map((r) => Math.max(...r.map((o) => o.amount))));
    this.asksAmountHighest$ = this.sortedAsks$
      .asObservable()
      .pipe(map((r) => Math.max(...r.map((o) => o.amount))));

    this.myOpenBids$ = this.myBids$
      .asObservable()
      .pipe(map((r) => r.filter((e) => e.status === this.bidAskStatuses.ACTIVE)));
    this.myOpenAsks$ = this.myAsks$
      .asObservable()
      .pipe(map((r) => r.filter((e) => e.status === this.bidAskStatuses.ACTIVE)));
    this.myOrderHistory$ = combineLatest([this.myBids$, this.myAsks$]).pipe(
      map(([bids, asks]) =>
        [...(bids || []), ...(asks || [])]
          .filter((e) => e.status !== this.bidAskStatuses.ACTIVE)
          .sort((a, b) => (b?.createdOn?.toMillis() || 0) - (a?.createdOn?.toMillis() || 0)),
      ),
    );

    this.buySellPriceDiff$ = combineLatest([this.sortedBids$, this.sortedAsks$]).pipe(
      map(([bids, asks]) => {
        // Never allow negative.
        const amount: number =
          asks.length > 0 && bids.length > 0
            ? +bigDecimal.subtract(asks[asks.length - 1].price, bids[0].price)
            : 0;
        if (amount < 0) {
          return 0;
        }

        return amount;
      }),
    );
  }

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);
    this.route.params?.pipe(untilDestroyed(this)).subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.token.token.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.listenToToken(id);
        this.listenToTrades(id);
        this.listenToOrderStats(id);

        // Default mid price. Only set once we have all data.
        const un = combineLatest([this.data.token$, this.asks$, this.bids$]).subscribe(
          ([token, asks, bids]) => {
            if (token?.uid === id && asks?.[0]?.token === id && bids?.[0]?.token === id) {
              un.unsubscribe();
              this.setMidPrice();
            }
          },
        );
      }
    });

    this.data.token$.pipe(skip(1)).subscribe((t) => {
      if (t) {
        this.fileApi
          .getMetadata(t?.overviewGraphics || '')
          .pipe(take(1), untilDestroyed(this))
          .subscribe((o) => {
            this.seo.setTags(
              $localize`Token` + ' - ' + this.helper.getPair(t),
              $localize`Buy, sell, and trade SOON and Shimmer tokens on a non-custodial, secure L1 exchange. Get started in minutes. Join today.`,
              o === 'image' ? t.overviewGraphics : undefined,
            );
          });
        if (t.space) {
          this.subscriptions$.push(
            this.spaceApi.listen(t.space).pipe(untilDestroyed(this)).subscribe(this.data.space$),
          );
        }
        this.listenToMemberSubs(this.auth.member$.value);
        this.isFavourite = ((getItem(StorageItem.FavouriteTokens) as string[]) || []).includes(
          t.uid,
        );
        const selectedTradePriceOptions = (getItem(StorageItem.SelectedTradePriceOption) || {}) as {
          [key: string]: PriceOptionType;
        };
        this.priceOption$.next(selectedTradePriceOptions[t.uid] || PriceOptionType.LIMIT);
        this.cd.markForCheck();
      }
    });

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((member) => {
      this.listenToMemberSubs(member);
    });

    interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.currentDate = dayjs();
        this.cd.markForCheck();
      });

    combineLatest([this.bids$.asObservable(), this.orderBookOption$])
      .pipe(
        map(([bids]) => bids),
        map((r) => this.groupOrders.call(this, r)),
        map((r) => this.combineOrdersBasedOnDecimal(true, r)),
        map((r) => r.sort((a: any, b: any) => b.price - a.price)),
        map((r) => r.slice(0, this.maximumOrderBookRows)),
        untilDestroyed(this),
      )
      .subscribe(this.sortedBids$);

    combineLatest([this.asks$.asObservable(), this.orderBookOption$])
      .pipe(
        map(([asks]) => asks),
        map((r) => this.groupOrders.call(this, r)),
        map((r) => this.combineOrdersBasedOnDecimal(false, r)),
        map((r) => r.sort((a: any, b: any) => b.price - a.price)),
        map((r) => r.slice(Math.max(0, r.length - this.maximumOrderBookRows), r.length)),
        untilDestroyed(this),
      )
      .subscribe(this.sortedAsks$);

    this.buySellPriceDiff$ = combineLatest([this.sortedBids$, this.sortedAsks$]).pipe(
      map(([bids, asks]) => {
        // Never allow negative.
        const amount =
          asks.length > 0 && bids.length > 0
            ? +bigDecimal.subtract(asks[asks.length - 1].price, bids[0].price)
            : 0;
        if (amount < 0) {
          return 0;
        }

        return amount;
      }),
    );

    this.priceOption$.pipe(skip(1), untilDestroyed(this)).subscribe((priceOption) => {
      if (this.data.token$.value) {
        setItem(StorageItem.SelectedTradePriceOption, {
          ...((getItem(StorageItem.SelectedTradePriceOption) || {}) as {
            [key: string]: PriceOptionType;
          }),
          [this.data.token$.value.uid]: priceOption,
        });
      }
    });

    merge(
      this.sortedBids$,
      this.sortedAsks$,
      this.currentTradeFormState$,
      this.amountControl.valueChanges,
    )
      .pipe(
        filter(() => this.priceOption$.value === PriceOptionType.MARKET),
        untilDestroyed(this),
      )
      .subscribe(() => {
        let amount =
          Number(this.amountControl.value) *
          NETWORK_DETAIL[this.data.token$.value?.mintingData?.network || DEFAULT_NETWORK].divideBy;
        let result = 0;
        if (this.currentTradeFormState$.value === TradeFormState.SELL) {
          for (let i = 0; i < this.sortedBids$.value.length; i++) {
            amount -= this.sortedBids$.value[i].amount;
            if (amount <= 0 || i === this.sortedBids$.value.length - 1) {
              result = this.sortedBids$.value[i].price;
              break;
            }
          }
        } else {
          for (let i = this.sortedAsks$.value.length - 1; i >= 0; i--) {
            amount -= this.sortedAsks$.value[i].amount;
            if (amount <= 0 || i === 0) {
              result = this.sortedAsks$.value[i].price;
              break;
            }
          }
        }
        this.priceControl.setValue(bigDecimal.round(result, 3));
        this.cd.markForCheck();
      });
  }

  private listenToMemberSubs(member: Member | undefined): void {
    this.memberDistributionSub$?.unsubscribe();
    this.subscriptionsMembersBids$?.forEach((s) => {
      s.unsubscribe();
    });
    if (member?.uid && this.data.token$.value?.uid) {
      this.memberDistributionSub$ = this.tokenApi
        .getMembersDistribution(this.data.token$.value?.uid, member.uid)
        .subscribe(this.memberDistribution$);
      // TODO paging?
      this.subscriptionsMembersBids$.push(
        this.tokenMarketApi
          .membersAsks(member.uid, this.data.token$.value?.uid, undefined)
          .pipe(untilDestroyed(this))
          .subscribe(this.myAsks$),
      );
      this.subscriptionsMembersBids$.push(
        this.tokenMarketApi
          .membersBids(member.uid, this.data.token$.value?.uid, undefined)
          .pipe(untilDestroyed(this))
          .subscribe(this.myBids$),
      );
    } else {
      this.memberDistribution$?.next(undefined);
    }
  }

  private combineOrdersBasedOnDecimal(floor: boolean, r: any[]): any {
    return Object.values(
      r
        .map((e: any) => {
          const transformedPrice = bigDecimal.multiply(
            bigDecimal.floor(bigDecimal.divide(e.price, this.orderBookOption$.value, 1000)),
            this.orderBookOption$.value,
          );
          return { ...e, price: Number(transformedPrice) };
        })
        .reduce((acc: any, e: any) => {
          if (!acc[e.price]) {
            return { ...acc, [e.price]: e };
          } else {
            return {
              ...acc,
              [e.price]: {
                ...acc[e.price],
                amount: Number(bigDecimal.add(acc[e.price].amount, e.amount)),
              },
            };
          }
        }, {} as { [key: string]: TransformedBidAskItem }),
    );
  }

  private listenToTrades(tokenId: string): void {
    // TODO Add pagging.
    this.subscriptions$.push(
      this.tokenMarketApi
        .asksActive(tokenId, undefined)
        .pipe(untilDestroyed(this))
        .subscribe(this.asks$),
    );
    this.subscriptions$.push(
      this.tokenMarketApi
        .bidsActive(tokenId, undefined)
        .pipe(untilDestroyed(this))
        .subscribe(this.bids$),
    );
  }

  private listenToOrderStats(tokenId: string): void {
    this.subscriptions$.push(
      this.tokenMarketApi
        .listenAvgPrice(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenAvgPrice$),
    );
  }

  private listenToPurchaseStats(tokenId: string, status: TokenStatus[]): void {
    // TODO Add pagging.
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenAvgPrice7d(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenAvgPrice7d$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenToPurchases(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.tradeHistory$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenChangePrice24h(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenChangePrice24h$),
    );
  }

  public get chartLengthTypes(): typeof TRADING_VIEW_INTERVALS {
    return TRADING_VIEW_INTERVALS;
  }

  public get askListingTypes(): typeof AskListingType {
    return AskListingType;
  }

  public get bidAskStatuses(): typeof TokenTradeOrderStatus {
    return TokenTradeOrderStatus;
  }

  public get myTradingTypes(): typeof MyTradingType {
    return MyTradingType;
  }

  public get tradeFormStates(): typeof TradeFormState {
    return TradeFormState;
  }

  public get infinity(): typeof Infinity {
    return Infinity;
  }

  public get tokenTradeOrderTypes(): typeof TokenTradeOrderType {
    return TokenTradeOrderType;
  }

  public get mobileViewStates(): typeof MobileViewState {
    return MobileViewState;
  }

  private listenToToken(id: string): void {
    this.cancelSubscriptions();
    let executedOnce = false;
    this.subscriptions$.push(
      this.tokenApi
        .listen(id)
        .pipe(untilDestroyed(this))
        .subscribe((obj) => {
          if (executedOnce === false && obj) {
            // Old records might not have this value set.
            this.listenToPurchaseStats(id, [obj.status || TokenStatus.PRE_MINTED]);
            executedOnce = true;
          }
          this.data.token$.next(obj);
        }),
    );
  }

  public getBidsTitle(_avg?: number): string {
    return $localize`Bids`;
  }

  public getAsksTitle(_avg?: number): string {
    return $localize`Asks`;
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public getShareUrl(): string {
    return (
      'https://twitter.com/share?text=Check out token&url=' +
      window?.location.href +
      '&hashtags=soonaverse'
    );
  }

  public async cancelOrder(tokenBuyBid: string): Promise<void> {
    const params: any = {
      uid: tokenBuyBid,
    };

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.tokenMarketApi.cancel(sc), $localize`Cancelled.`, finish)
        .subscribe(() => {
          //
        });
    });
  }

  public get bidListingTypes(): typeof BidListingType {
    return BidListingType;
  }

  public get priceOptionTypes(): typeof PriceOptionType {
    return PriceOptionType;
  }

  private groupOrders(r: TokenTradeOrder[]): TransformedBidAskItem[] {
    return Object.values(
      r.reduce((acc, e) => {
        const key =
          e.owner === this.auth.member$.value?.uid
            ? `${e.price}_${this.auth.member$.value?.uid || ''}`
            : e.price;
        return {
          ...acc,
          [key]: [...(acc[key] || []), e],
        };
      }, {} as { [key: number | string]: TokenTradeOrder[] }),
    ).map((e) =>
      e.reduce(
        (acc, el) => ({
          price: el.price,
          amount: acc.amount + el.count - el.fulfilled,
          isOwner: el.owner === this.auth.member$.value?.uid,
        }),
        { price: 0, amount: 0, total: 0, isOwner: false } as TransformedBidAskItem,
      ),
    );
  }

  public getResultAmount(): number {
    if (isNaN(this.amountControl.value) || isNaN(this.priceControl.value)) return 0;
    return Number(bigDecimal.multiply(this.amountControl.value, this.priceControl.value));
  }

  public openTradeModal(): void {
    if (this.currentTradeFormState$.value === TradeFormState.BUY) {
      this.isBidTokenOpen = true;
      this.isAskTokenOpen = false;
    } else {
      this.isAskTokenOpen = true;
      this.isBidTokenOpen = false;
    }
    this.cd.markForCheck();
  }

  public moreThanBalance(): boolean {
    return (
      this.currentTradeFormState$.value === TradeFormState.SELL &&
      this.memberDistribution$?.value?.tokenOwned !== null &&
      (this.memberDistribution$?.value?.tokenOwned || 0) *
        Math.pow(10, getDefDecimalIfNotSet(this.data.token$.value?.decimals)) <
        this.amountControl.value
    );
  }

  public get networkDetails(): typeof NETWORK_DETAIL {
    return NETWORK_DETAIL;
  }

  public setMidPrice(): void {
    combineLatest([this.sortedBids$, this.sortedAsks$])
      .pipe(
        filter(([bids, asks]) => bids.length > 0 && asks.length > 0),
        first(),
        untilDestroyed(this),
      )
      .subscribe(([bids, asks]) => {
        this.priceControl.setValue(
          bigDecimal.divide(bigDecimal.add(bids[0].price, asks[asks.length - 1].price), 2, 3),
        );
      });
  }

  public isMidPrice(
    bids: TransformedBidAskItem[] | null,
    asks: TransformedBidAskItem[] | null,
  ): boolean {
    if (!bids?.length || !asks?.length) return false;
    return (
      bigDecimal.divide(bigDecimal.add(bids[0].price, asks[asks.length - 1].price), 2, 3) ===
      bigDecimal.round(this.priceControl.value, 3)
    );
  }

  public setBidPrice(): void {
    this.sortedBids$
      .pipe(
        filter((bids) => bids.length > 0),
        first(),
        untilDestroyed(this),
      )
      .subscribe((bids) => {
        this.priceControl.setValue(bigDecimal.round(bids[0].price, 3));
      });
  }

  public isBidPrice(bids: TransformedBidAskItem[] | null): boolean {
    if (!bids?.length) return false;
    return bigDecimal.round(bids[0].price, 3) === bigDecimal.round(this.priceControl.value, 3);
  }

  public setAskPrice(): void {
    this.sortedAsks$
      .pipe(
        filter((asks) => asks.length > 0),
        first(),
        untilDestroyed(this),
      )
      .subscribe((asks) => {
        this.priceControl.setValue(bigDecimal.round(asks[asks.length - 1].price, 3));
      });
  }

  public isAskPrice(asks: TransformedBidAskItem[] | null): boolean {
    if (!asks?.length) return false;
    return (
      bigDecimal.round(asks[asks.length - 1].price, 3) ===
      bigDecimal.round(this.priceControl.value, 3)
    );
  }

  public set7dVwapPrice(): void {
    this.priceControl.setValue(bigDecimal.round(this.listenAvgPrice7d$.getValue(), 3));
  }

  public is7dVwapPrice(): boolean {
    return (
      this.listenAvgPrice7d$.getValue() !== 0 &&
      bigDecimal.round(this.listenAvgPrice7d$.getValue(), 3) ===
        bigDecimal.round(this.priceControl.value, 3)
    );
  }

  public setCurrentPrice(): void {
    this.priceControl.setValue(bigDecimal.round(this.listenAvgPrice$.getValue(), 3));
  }

  public setFavourite(): void {
    this.isFavourite = !this.isFavourite;
    const favourites = (getItem(StorageItem.FavouriteTokens) as string[]) || [];
    setItem(
      StorageItem.FavouriteTokens,
      this.isFavourite
        ? [...favourites, this.data.token$.value?.uid]
        : favourites.filter((e) => e !== this.data.token$.value?.uid),
    );
    this.cd.markForCheck();
  }

  public getDateDiff(date: Timestamp): string {
    const dayDiff = dayjs().diff(dayjs(date.toDate()), 'day');
    if (dayDiff <= 0) {
      return '';
    }

    return dayjs(date.toDate()).fromNow();
  }

  public get exchangeFee(): number {
    return SERVICE_MODULE_FEE_TOKEN_EXCHANGE;
  }

  public getFee(): number {
    return Number(bigDecimal.multiply(this.getResultAmount(), this.exchangeFee * 100 * 100));
  }

  public orderBookRowClick(item: TransformedBidAskItem, state: TradeFormState): void {
    // Disabled setting of the amount as I believe it does not make sense.
    this.currentTradeFormState$.next(
      state === TradeFormState.BUY ? TradeFormState.SELL : TradeFormState.BUY,
    );
    this.amountControl.setValue(
      item.amount / Math.pow(10, getDefDecimalIfNotSet(this.data.token$.value?.decimals)),
    );
    this.priceOption$.next(PriceOptionType.LIMIT);
    this.priceControl.setValue(bigDecimal.round(item.price, 3));
  }

  public getDefaultNetworkDecimals(): number {
    return DEFAULT_NETWORK_DECIMALS;
  }

  public tradeHistoryClick(item: TokenPurchase): void {
    this.tradeDetailOrder = null;
    this.tradeDetailPurchases = item;
    this.cd.markForCheck();
  }

  public orderClick(item: TokenTradeOrder): void {
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .getPurchasesForTrade(item)
        .pipe(first(), untilDestroyed(this))
        .subscribe((r) => {
          this.tradeDetailOrder = item;
          this.tradeDetailPurchases = r;
          this.cd.markForCheck();
        }),
    );
  }

  public mobileBuySellClick(state: TradeFormState): void {
    this.currentTradeFormState$.next(state);
    this.isTradeDrawerVisible = true;
    this.cd.markForCheck();
  }

  public setCancelTradeOrder(event: MouseEvent, item: TokenTradeOrder): void {
    event.stopPropagation();
    this.cancelTradeOrder = item;
    this.cd.markForCheck();
  }

  private cancelSubscriptions(): void {
    this.priceControl.setValue('');
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
