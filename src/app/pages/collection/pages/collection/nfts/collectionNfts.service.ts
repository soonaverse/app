import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Nft, Collection } from '@build-5/interfaces';
import { CartService } from '@components/cart/services/cart.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionNftStateService {
  private listedNftsSubject = new BehaviorSubject<Nft[]>([]);
  public listedNfts$ = this.listedNftsSubject.asObservable();
  private availableNftsCountSubject = new BehaviorSubject<number>(0);
  public availableNftsCount$ = this.availableNftsCountSubject.asObservable();

  constructor(private cartService: CartService) {}

  public setListedNfts(nfts: Nft[], collection: Collection) {
    this.listedNftsSubject.next(nfts);
    this.updateAvailableNftsCount(nfts, collection);
  }

  private updateAvailableNftsCount(nfts: Nft[], collection: Collection) {
    const availableNftsCount = nfts.filter((nft) =>
      this.cartService.isNftAvailableForSale(nft, collection),
    ).length;
    this.availableNftsCountSubject.next(availableNftsCount);
  }

  public getListedNfts(): Nft[] {
    return this.listedNftsSubject.getValue();
  }
}
