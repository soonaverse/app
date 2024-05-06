import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import { Nft, Collection } from '@buildcore/interfaces';
import { CartService } from '@components/cart/services/cart.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionNftStateService {
  private listedNftsSubject$ = new BehaviorSubject<Nft[]>([]);
  public listedNfts$ = this.listedNftsSubject$.asObservable();
  private availableNftsCountSubject$ = new BehaviorSubject<number>(0);
  public availableNftsCount$ = this.availableNftsCountSubject$.asObservable();

  constructor(private cartService: CartService) {}

  public getListedNftsObservable(collection: Collection): Observable<Nft[]> {
    return this.listedNfts$.pipe(
      switchMap((nfts) =>
        combineLatest(
          nfts.map((nft) =>
            this.cartService
              .isNftAvailableForSale(nft, collection, true)
              .pipe(map((availability) => ({ nft, isAvailable: availability.isAvailable }))),
          ),
        ),
      ),
      map((nftsWithAvailability) =>
        nftsWithAvailability.filter(({ isAvailable }) => isAvailable).map(({ nft }) => nft),
      ),
    );
  }

  public setListedNfts(nfts: Nft[], collection: Collection) {
    this.listedNftsSubject$.next(nfts);
    this.updateAvailableNftsCount(nfts, collection);
  }

  private updateAvailableNftsCount(nfts: Nft[], collection: Collection) {
    this.getListedNftsObservable(collection)
      .pipe(
        map((nftsForSale) => nftsForSale.length),
        take(1),
      )
      .subscribe((count) => this.availableNftsCountSubject$.next(count));
  }
}
