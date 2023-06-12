import { Injectable, OnDestroy } from '@angular/core';
import { CollectionApi } from '@api/collection.api';
import { TickerApi } from '@api/ticker.api';
import { TokenApi } from '@api/token.api';
import { Collection, Space, TICKERS, Ticker, Token } from '@soonaverse/interfaces';
import { BehaviorSubject, Observable, Subscription, of, timer } from 'rxjs';
import { SpaceApi } from './../../../@api/space.api';

export type CacheObject<T> = {
  [key: string]: BehaviorSubject<T | undefined>;
};

export const MAX_MULTIPLE_ITEMS = 10;
export const CACHE_FETCH_DEBOUNCE_SPAN = 250;

@Injectable({
  providedIn: 'root',
})
export class CacheService implements OnDestroy {
  public spaces: CacheObject<Space> = {};
  public tokens: CacheObject<Token> = {};
  public collections: CacheObject<Collection> = {};
  public iotaUsdPrice$ = new BehaviorSubject<number>(0);
  public smrUsdPrice$ = new BehaviorSubject<number>(0);

  // We use this instead of optional params to open check after clicking buy now in the NFT card.
  public openCheckout = false;

  private collectionsToLoad: string[] = [];
  private spacesToLoad: string[] = [];
  private fetchSpacesTimeout?: number;
  private tokensToLoad: string[] = [];
  private fetchTokensTimeout?: number;
  private fetchCollectionsTimeout?: number;
  private spaceSubscriptions$: Subscription[] = [];
  private tokenSubscriptions$: Subscription[] = [];
  private collectionSubscriptions$: Subscription[] = [];
  private interval$?: Subscription;
  private tickers$: Subscription[] = [];

  constructor(
    private spaceApi: SpaceApi,
    private tokenApi: TokenApi,
    private collectionApi: CollectionApi,
    private tickerApi: TickerApi,
  ) {
    // none.
  }

  public listenToUsdPrices(): void {
    this.interval$?.unsubscribe();
    this.tickers$.forEach((s) => {
      s.unsubscribe();
    });

    // Every 5 minutes.
    this.interval$ = timer(0, 5 * 60 * 1000).subscribe(async () => {
      this.tickers$.push(
        this.tickerApi.listen(TICKERS.IOTAUSD).subscribe((t?: Ticker) => {
          if (!t) return;
          this.iotaUsdPrice$.next(t.price);
        }),
      );
      this.tickers$.push(
        this.tickerApi.listen(TICKERS.SMRUSD).subscribe((t?: Ticker) => {
          if (!t) return;
          this.smrUsdPrice$.next(t.price);
        }),
      );
    });
  }

  public getSpace(id?: string): BehaviorSubject<Space | undefined> {
    if (!id) {
      return new BehaviorSubject<Space | undefined>(undefined);
    }

    if (this.spaces[id]) {
      return this.spaces[id];
    }

    this.spaces[id] = new BehaviorSubject<Space | undefined>(undefined);
    this.spacesToLoad.push(id);

    if (this.fetchSpacesTimeout) {
      clearTimeout(this.fetchSpacesTimeout);
      this.fetchSpacesTimeout = undefined;
    }

    this.fetchSpacesTimeout = window?.setTimeout(() => {
      this.fetchSpacesTimeout = undefined;
      this.fetchSpaces(this.spacesToLoad);
      this.spacesToLoad = [];
    }, CACHE_FETCH_DEBOUNCE_SPAN);

    if (this.spacesToLoad.length === MAX_MULTIPLE_ITEMS) {
      this.fetchSpaces(this.spacesToLoad);
      this.spacesToLoad = [];
    }

    return this.spaces[id];
  }

  private fetchSpaces(ids: string[]): void {
    if (!ids.length) return;

    this.spaceSubscriptions$.push(
      this.spaceApi.listenMultiple(ids).subscribe((s: Space[]) => {
        s.map((c) => this.spaces[c.uid].next(c));
      }),
    );
  }

  public getToken(id?: string): BehaviorSubject<Token | undefined> {
    if (!id) {
      return new BehaviorSubject<Token | undefined>(undefined);
    }

    if (this.tokens[id]) {
      return this.tokens[id];
    }

    this.tokens[id] = new BehaviorSubject<Token | undefined>(undefined);
    this.tokensToLoad.push(id);

    if (this.fetchTokensTimeout) {
      clearTimeout(this.fetchTokensTimeout);
      this.fetchTokensTimeout = undefined;
    }

    this.fetchTokensTimeout = window?.setTimeout(() => {
      this.fetchTokensTimeout = undefined;
      this.fetchTokens(this.tokensToLoad);
      this.tokensToLoad = [];
    }, CACHE_FETCH_DEBOUNCE_SPAN);

    if (this.tokensToLoad.length === MAX_MULTIPLE_ITEMS) {
      this.fetchTokens(this.tokensToLoad);
      this.tokensToLoad = [];
    }

    return this.tokens[id];
  }

  private fetchTokens(ids: string[]): void {
    if (!ids.length) return;

    this.tokenSubscriptions$.push(
      this.tokenApi.listenMultiple(ids).subscribe((s: Token[]) => {
        s.map((c) => this.tokens[c.uid].next(c));
      }),
    );
  }

  public getCollection(id: string): Observable<Collection | undefined> {
    if (!id) {
      return of(undefined);
    }

    if (this.collections[id]) {
      return this.collections[id];
    }

    this.collections[id] = new BehaviorSubject<Collection | undefined>(undefined);

    this.collectionsToLoad.push(id);
    if (this.fetchCollectionsTimeout) {
      clearTimeout(this.fetchCollectionsTimeout);
      this.fetchCollectionsTimeout = undefined;
    }

    this.fetchCollectionsTimeout = window?.setTimeout(() => {
      this.fetchCollectionsTimeout = undefined;
      this.fetchCollections(this.collectionsToLoad);
      this.collectionsToLoad = [];
    }, CACHE_FETCH_DEBOUNCE_SPAN);

    if (this.collectionsToLoad.length === MAX_MULTIPLE_ITEMS) {
      this.fetchCollections(this.collectionsToLoad);
      this.collectionsToLoad = [];
    }

    return this.collections[id];
  }

  private fetchCollections(ids: string[]): void {
    if (!ids.length) return;
    this.collectionSubscriptions$.push(
      this.collectionApi.listenMultiple(ids).subscribe((s: Collection[]) => {
        s.map((c) => this.collections[c.uid].next(c));
      }),
    );
  }

  public cancelSubscriptions(): void {
    this.interval$?.unsubscribe();
    this.tickers$.forEach((s) => {
      s.unsubscribe();
    });
    this.spaceSubscriptions$.forEach((s) => {
      s.unsubscribe();
    });
    this.tokenSubscriptions$.forEach((s) => {
      s.unsubscribe();
    });
    this.collectionSubscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
