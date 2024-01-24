import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Nft, Collection, MIN_AMOUNT_TO_TRANSFER } from '@build-5/interfaces';
import { getItem, setItem, StorageItem } from './../../../@core/utils/local-storage.utils';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HelperService } from '@pages/nft/services/helper.service';
import { AuthService } from '@components/auth/services/auth.service';

export interface CartItem {
  nft: Nft;
  collection: Collection;
  quantity: number;
  salePrice: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private showCartSubject = new BehaviorSubject<boolean>(false);
  public showCart$ = this.showCartSubject.asObservable();
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadCartItems());

  constructor(
    private notification: NzNotificationService,
    private helperService: HelperService,
    public auth: AuthService,
  ) {
    // console.log('CartService instance created');
  }

  public showCart(): void {
    this.showCartSubject.next(true);
  }

  public hideCart(): void {
    this.showCartSubject.next(false);
  }

  public refreshCartItems(): void {
    this.cartItemsSubject.next(this.cartItemsSubject.value);
  }

  public addToCart(cartItem: CartItem): void {
    console.log('[CartService] addToCart function called. Adding cart item: ', cartItem);
    const currentItems = this.cartItemsSubject.value;

    const isItemAlreadyInCart = currentItems.some((item) => item.nft.uid === cartItem.nft.uid);

    if (!isItemAlreadyInCart) {
      const updatedCartItems = [...currentItems, cartItem];
      this.cartItemsSubject.next(updatedCartItems);
      this.saveCartItems();
      this.notification.success(
        $localize`NFT ` +
          cartItem.nft.name +
          ` from collection ` +
          cartItem.collection.name +
          ` has been added to your cart.`,
        '',
      );
      // console.log('[CartService] NFT added to cart:', cartItem);
    } else {
      // console.log('[CartService] NFT is already in the cart:', cartItem);
      this.notification.error($localize`This NFT already exists in your cart.`, '');
    }
  }

  public removeFromCart(itemId: string): void {
    // console.log('[CartService] removeFromCart function called.');
    const updatedCartItems = this.cartItemsSubject.value.filter((item) => item.nft.uid !== itemId);
    this.cartItemsSubject.next(updatedCartItems);
    this.saveCartItems();
    // console.log('[CartService-removeFromCart] Cart updated:', updatedCartItems);
  }

  public removeItemsFromCart(itemIds: string[]): void {
    const updatedCartItems = this.cartItemsSubject.value.filter(
      (item) => !itemIds.includes(item.nft.uid),
    );
    this.cartItemsSubject.next(updatedCartItems);
    this.saveCartItems();
  }

  public removeGroupItemsFromCart(tokenSymbol: string): void {
    const updatedCartItems = this.cartItemsSubject.value.filter((item) => {
      const itemTokenSymbol =
        (item.nft?.placeholderNft
          ? item.collection?.mintingData?.network
          : item.nft?.mintingData?.network) || 'Unknown';
      return itemTokenSymbol !== tokenSymbol;
    });
    this.cartItemsSubject.next(updatedCartItems);
    this.saveCartItems();
  }

  public getCartItems(): BehaviorSubject<CartItem[]> {
    // console.log('[CartService] getCartItems function called.');
    return this.cartItemsSubject;
  }

  public updateCartItems(updatedItems: CartItem[]): void {
    this.cartItemsSubject.next(updatedItems); // Update the BehaviorSubject with the new cart items
    this.saveCartItems(); // Save the updated cart items to local storage or your backend
  }

  public saveCartItems(): void {
    // console.log('[CartService] getCartItems function called.');
    setItem(StorageItem.CartItems, this.cartItemsSubject.value);
    // console.log('[CartService] Saving cart items to local storage:', this.cartItemsSubject.value);
  }

  private loadCartItems(): CartItem[] {
    // console.log('[CartService] Loading cart items from local storage');
    const items = getItem(StorageItem.CartItems) as CartItem[];
    // console.log('[CartService] Cart items loaded from local storage:', items);
    return items || [];
  }

  public isNftAvailableForSale(nft: Nft, collection: Collection): boolean {
    const isLocked = this.helperService.isLocked(nft, collection, true);
    const isOwner = nft.owner === this.auth.member$.value?.uid;
    const availableForSale = this.helperService.isAvailableForSale(nft, collection);
    // console.log(`[cart.service-isNftAvailableForSale] results for NFT ${nft.name}; availableForSale: ${availableForSale}, isLocked: ${isLocked}, isOwner: ${isOwner}`);

    return !isLocked && availableForSale && (!isOwner || !nft.owner);
  }

  public isCartItemAvailableForSale(cartItem: CartItem): boolean {
    return this.isNftAvailableForSale(cartItem.nft, cartItem.collection);
  }

  public getAvailableNftQuantity(cartItem: CartItem): number {
    const isAvailableForSale = this.helperService.isAvailableForSale(
      cartItem.nft,
      cartItem.collection,
    );
    // console.log("[cart.service-getAvailableNftQuantity] function called for cartItem.nft.name: " + cartItem.nft.name + ", isAvailableForSale: " + isAvailableForSale);

    if (cartItem.nft.placeholderNft && isAvailableForSale) {
      // console.log("[service-getAvailableNftQuantity] returning qty, placeholder: " + cartItem.nft.placeholderNft + ". availableNfts " + cartItem.collection.availableNfts);
      return cartItem.collection.availableNfts || 0;
    } else if (isAvailableForSale) {
      // console.log("[service-getAvailableNftQuantity] returning 1, isAvailableForSale: " + isAvailableForSale + ". placeholder: " + cartItem.nft.placeholderNft);
      return 1;
    }
    // console.log("[service-getAvailableNftQuantity] returning 0, isAvailableForSale: " + isAvailableForSale + ". placeholder: " + cartItem.nft.placeholderNft);
    return 0;
  }

  public discount(collection?: Collection | null, nft?: Nft | null): number {
    if (!collection?.space || !this.auth.member$.value || nft?.owner) {
      return 1;
    }

    const spaceRewards = (this.auth.member$.value.spaces || {})[collection.space];
    const descDiscounts = [...(collection.discounts || [])].sort((a, b) => b.amount - a.amount);
    for (const discount of descDiscounts) {
      const awardStat = (spaceRewards?.awardStat || {})[discount.tokenUid!];
      const memberTotalReward = awardStat?.totalReward || 0;
      if (memberTotalReward >= discount.tokenReward) {
        return 1 - discount.amount;
      }
    }
    return 1;
  }

  public calc(amount: number | null | undefined, discount: number): number {
    let finalPrice = Math.ceil((amount || 0) * discount);
    if (finalPrice < MIN_AMOUNT_TO_TRANSFER) {
      finalPrice = MIN_AMOUNT_TO_TRANSFER;
    }

    return finalPrice;
  }

  public calcPrice(item: CartItem, discount: number): number {
    const itemPrice = item.nft?.availablePrice || item.nft?.price || 0;
    return this.calc(itemPrice, discount); // assuming calc method applies the discount
  }
}
