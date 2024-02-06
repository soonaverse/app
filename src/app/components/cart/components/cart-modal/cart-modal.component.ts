import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  Nft,
  Collection,
  MIN_AMOUNT_TO_TRANSFER,
  Network,
  DEFAULT_NETWORK,
} from '@build-5/interfaces';
import { Subscription, forkJoin, take, map, catchError, of } from 'rxjs';
import { CartService, CartItem } from '@components/cart/services/cart.service';
import { AuthService } from '@components/auth/services/auth.service';
import { Router } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { NftApi } from '@api/nft.api';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { UnitsService } from '@core/services/units/units.service';

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  COMPLETE = 'Complete',
}

@Component({
  selector: 'wen-app-cart-modal',
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartModalComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  public collectionPath: string = ROUTER_UTILS.config.collection.root;
  public nftPath: string = ROUTER_UTILS.config.nft.root;
  public cartItemsQuantities: number[] = [];
  public cartItemPrices: {
    [key: string]: { originalPrice: number; discountedPrice: number; tokenSymbol: Network };
  } = {};
  public stepType = StepType;

  constructor(
    public cartService: CartService,
    private cd: ChangeDetectorRef,
    public auth: AuthService,
    private nftApi: NftApi,
    private notification: NzNotificationService,
    private router: Router,
    public unitsService: UnitsService,
  ) {}

  ngOnInit() {
    this.subscriptions$.add(
      this.cartService.cartModalOpen$.subscribe((isOpen) => {
        this.cd.markForCheck();
        if (isOpen) {
          this.refreshCartData();
        }
      }),
    );
  }

  cartItemsStatus: { status: string; message: string }[] = [];

  trackByItemId(index: number, item: CartItem): string {
    return item.nft.uid;
  }

  public removeFromCart(item: CartItem): void {
    this.cartService.removeFromCart(item);
  }

  private refreshCartData() {
    const cartItems = this.cartService.getCartItems().getValue();

    const freshDataObservables = cartItems.map((item) =>
      this.nftApi.getNftById(item.nft.uid).pipe(
        take(1),
        map((freshNft) => {
          return freshNft ? { ...item, nft: freshNft } : item;
        }),
        catchError((error) => {
          return of(item);
        }),
      ),
    );

    forkJoin(freshDataObservables).subscribe(
      (freshCartItems) => {
        this.cartService.updateCartItems(freshCartItems);

        this.cartItemsStatus = freshCartItems.map((item) => this.cartItemStatus(item));
        this.cartItemsQuantities = freshCartItems.map((item) =>
          this.cartItemSaleAvailableQty(item),
        );

        freshCartItems.forEach((item) => {
          const originalPrice = this.calcPrice(item, 1);
          const discountedPrice = this.calcPrice(item, this.discount(item.collection, item.nft));
          const tokenSymbol =
            (item.nft.placeholderNft
              ? item.collection.mintingData?.network
              : item.nft.mintingData?.network) ?? DEFAULT_NETWORK;
          this.cartItemPrices[item.nft.uid] = { originalPrice, discountedPrice, tokenSymbol };
          this.cd.markForCheck();
        });

        this.cd.markForCheck();
      },
      (error) => {
        this.notification.error($localize`Error while refreshing cart items: ` + error, '');
      },
    );
  }

  public getSelectedNetwork(): any {
    return localStorage.getItem('cartCheckoutSelectedNetwork') || '';
  }

  public updateQuantity(event: Event, itemId: string): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = Number(inputElement.value);

    const cartItems = this.cartService.getCartItems().getValue();
    const itemIndex = cartItems.findIndex((cartItem) => cartItem.nft.uid === itemId);

    if (itemIndex !== -1) {
      const maxQuantity = this.cartItemsQuantities[itemIndex];
      const minQuantity = 1;

      if (newQuantity < minQuantity) {
        newQuantity = minQuantity;
        inputElement.value = minQuantity.toString();
      } else if (newQuantity > maxQuantity) {
        newQuantity = maxQuantity;
        inputElement.value = maxQuantity.toString();
      }

      cartItems[itemIndex].quantity = newQuantity;
      this.cartService.saveCartItems();
    }
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
    return this.calc(itemPrice, discount);
  }

  public cartItemStatus(item: CartItem): { status: string; message: string } {
    const availabilityResult = this.cartService.isCartItemAvailableForSale(item);
    if (availabilityResult.isAvailable) {
      return { status: 'Available', message: '' };
    }
    return { status: 'Not Available', message: availabilityResult.message };
  }

  private cartItemSaleAvailableQty(item: CartItem): number {
    const availQty = this.cartService.getAvailableNftQuantity(item);
    return availQty;
  }

  public handleClose(): void {
    this.cartService.hideCartModal();
  }

  public goToNft(nftUid: string): void {
    if (!nftUid) {
      return;
    }

    this.router.navigate(['/', this.nftPath, nftUid]);
    this.cartService.hideCartModal();
  }

  public goToCollection(colUid: string): void {
    if (!colUid) {
      return;
    }

    this.router.navigate(['/', this.collectionPath, colUid]);
    this.cartService.hideCartModal();
  }

  async handleCartCheckout(): Promise<void> {
    this.cartService.openCheckoutOverlay();
  }

  public clearCart(): void {
    this.cartService.clearCart();
    this.refreshCartData();
  }

  public closeCheckoutOverlay(): void {
    this.cartService.closeCheckoutOverlay();
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }
}
