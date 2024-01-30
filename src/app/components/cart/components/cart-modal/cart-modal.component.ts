// cart-modal.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
} from '@angular/core';
import { Nft, Collection, MIN_AMOUNT_TO_TRANSFER } from '@build-5/interfaces';
import { Subscription, forkJoin, map, take, catchError, of } from 'rxjs';
import { CartService, CartItem } from './../../services/cart.service';
import { AuthService } from '@components/auth/services/auth.service';
import { Router } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CheckoutOverlayComponent } from '../checkout/checkout-overlay.component';
import { NftApi } from '@api/nft.api';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'wen-app-cart-modal',
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartModalComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  public collectionPath: string = ROUTER_UTILS.config.collection.root;
  public nftPath: string = ROUTER_UTILS.config.nft.root;
  public cartItemsQuantities: number[] = [];
  cartItemPrices: { [key: string]: { originalPrice: number; discountedPrice: number } } = {};
  isCartCheckoutOpen = false;

  constructor(
    public cartService: CartService,
    private cd: ChangeDetectorRef,
    public auth: AuthService,
    private modalService: NzModalService,
    private nftApi: NftApi,
    private notification: NzNotificationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.cartService.getCartItems().subscribe((items) => {
        this.cartItemsStatus = items.map((item) => this.cartItemStatus(item));
        this.cartItemsQuantities = items.map((item) => this.cartItemSaleAvailableQty(item));
        items.forEach((item) => {
          const originalPrice = this.calcPrice(item, 1);
          const discountedPrice = this.calcPrice(item, this.discount(item.collection, item.nft));
          this.cartItemPrices[item.nft.uid] = { originalPrice, discountedPrice };
        });
      }),
    );

    this.subscriptions.add(
      this.cartService.showCart$.subscribe((show) => {
        if (show) {
          this.refreshCartData();
        }
      }),
    );
  }

  cartItemsStatus: string[] = [];

  trackByItemId(index: number, item: CartItem): string {
    return item.nft.uid;
  }

  public removeFromCart(itemId: string): void {
    this.cartService.removeFromCart(itemId);
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
          this.cartItemPrices[item.nft.uid] = { originalPrice, discountedPrice };
        });

        this.cd.markForCheck();
      },
      (error) => {
        console.error('Error while refreshing cart items: ', error);
        this.notification.error($localize`Error while refreshing cart items: ` + error, '');
      },
    );
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

  public cartItemStatus(item: CartItem): any {
    const itemAvailable = this.cartService.isCartItemAvailableForSale(item);
    if (itemAvailable) {
      return 'Available';
    }
    return 'Not Available';
  }

  private cartItemSaleAvailableQty(item: CartItem): number {
    const availQty = this.cartService.getAvailableNftQuantity(item);
    return availQty;
  }

  public handleClose(): void {
    this.cartService.hideCart();
  }

  public goToNft(nftUid: string): void {
    if (!nftUid) {
      console.error('No NFT UID provided.');
      return;
    }

    this.router.navigate(['/', this.nftPath, nftUid]);
    this.cartService.hideCart();
  }

  public goToCollection(colUid: string): void {
    if (!colUid) {
      console.error('No Collection UID provided.');
      return;
    }

    this.router.navigate(['/', this.collectionPath, colUid]);
    this.cartService.hideCart();
  }

  public handleCartCheckout(): void {
    const cartItems = this.cartService.getCartItems().getValue();

    const modalRef = this.modalService.create({
      nzTitle: 'Checkout',
      nzContent: CheckoutOverlayComponent,
      nzComponentParams: { items: cartItems },
      nzFooter: null,
      nzWidth: '80%',
    });

    modalRef.afterClose.subscribe(() => {
      // this.cartService.hideCart();
    });
  }

  public handleCloseCartCheckout(alsoCloseCartModal: boolean): void {
    if (alsoCloseCartModal) {
      this.cartService.hideCart();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
