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
import {
  Nft,
  Collection,
  MIN_AMOUNT_TO_TRANSFER,
 } from '@build-5/interfaces';
import { Subscription, forkJoin, map, take, catchError, of } from 'rxjs';
import { CartService, CartItem } from './../../services/cart.service';
import { AuthService } from '@components/auth/services/auth.service';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CheckoutOverlayComponent } from '../checkout/checkout-overlay.component';
import { NftApi } from '@api/nft.api';
import { NzNotificationService } from 'ng-zorro-antd/notification';


@Component({
  selector: 'app-cart-modal',
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartModalComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  public collectionPath: string = ROUTER_UTILS.config.collection.root;
  public nftPath: string = ROUTER_UTILS.config.nft.root;
  public cartItemsQuantities: number[] = [];
  cartItemPrices: { [key: string]: { originalPrice: number, discountedPrice: number } } = {};
  isCartCheckoutOpen = false;

  @Output() onCartCheckout = new EventEmitter<void>();

  constructor(
    public cartService: CartService,
    private cd: ChangeDetectorRef,
    public auth: AuthService,
    private modalService: NzModalService,
    private nftApi: NftApi,
    private notification: NzNotificationService,
  ) {}

  ngOnInit() {
    this.subscriptions.add(this.cartService.getCartItems().subscribe(items => {
      //console.log('[CartModalComponent-ngOnInit] Cart items updated:', items);
      this.cartItemsStatus = items.map(item => this.cartItemStatus(item));
      this.cartItemsQuantities = items.map(item => this.cartItemSaleAvailableQty(item));
      items.forEach(item => {
        const originalPrice = this.calcPrice(item, 1);
        const discountedPrice = this.calcPrice(item, this.discount(item.collection, item.nft));
        this.cartItemPrices[item.nft.uid] = { originalPrice, discountedPrice };
      });
    }));

    this.subscriptions.add(this.cartService.showCart$.subscribe(show => {
      if (show) {
        this.refreshCartData();
      }
    }));
  }

  cartItemsStatus: string[] = [];

  trackByItemId(index: number, item: CartItem): string {
    return item.nft.uid;
  }

  public removeFromCart(itemId: string): void {
    this.cartService.removeFromCart(itemId);
  }

  private refreshCartData() {
    //console.log('Refreshing cart items...');
    const cartItems = this.cartService.getCartItems().getValue();
    //console.log('Current cart items:', cartItems);

    const freshDataObservables = cartItems.map(item =>
      this.nftApi.getNftById(item.nft.uid).pipe(
        take(1),
        map(freshNft => {
          //console.log(`Fetched fresh data for NFT ${item.nft.uid}:`, freshNft);
          return freshNft ? { ...item, nft: freshNft } : item;
        }),
        catchError(error => {
          //console.error(`Error fetching fresh data for NFT ${item.nft.uid}:`, error);
          return of(item); // Return the original item in case of error
        })
      )
    );

    forkJoin(freshDataObservables).subscribe(
      freshCartItems => {
        //console.log('Fresh cart items:', freshCartItems);

        this.cartService.updateCartItems(freshCartItems);

        this.cartItemsStatus = freshCartItems.map(item => this.cartItemStatus(item));
        this.cartItemsQuantities = freshCartItems.map(item => this.cartItemSaleAvailableQty(item));
        freshCartItems.forEach(item => {
          const originalPrice = this.calcPrice(item, 1);
          const discountedPrice = this.calcPrice(item, this.discount(item.collection, item.nft));
          this.cartItemPrices[item.nft.uid] = { originalPrice, discountedPrice };
        });

        //console.log('Finished refreshing cart items.');

        this.cd.markForCheck();
      },
      error => {
        console.error('Error while refreshing cart items: ', error);
        this.notification.error($localize`Error while refreshing cart items: ` + error, '');
      }
    );
  }

  public updateQuantity(event: Event, itemId: string): void {
    const inputElement = event.target as HTMLInputElement;
    const newQuantity = Number(inputElement.value);

    if (newQuantity === 0) {
      this.cartService.removeFromCart(itemId);
    } else {
      const cartItems = this.cartService.getCartItems().getValue();
      const itemIndex = cartItems.findIndex(cartItem => cartItem.nft.uid === itemId);
      if (itemIndex !== -1) {
        cartItems[itemIndex].quantity = newQuantity;
        this.cartService.saveCartItems();
      }
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
    return this.calc(itemPrice, discount); // assuming calc method applies the discount
  }

  public cartItemStatus(item: CartItem): any {
    //console.log("[cart-modal.component-cartItemStatus] function called");
    const itemAvailable = this.cartService.isCartItemAvailableForSale(item);
    if(itemAvailable) {
      //console.log("[cart-modal.component-cartItemStatus] returning Available, itemAvailable: " + itemAvailable);
      return "Available";
    };
    //console.log("[cart-modal.component-cartItemStatus] returning Not Available, itemAvailable: " + itemAvailable);
    return "Not Available";
  };

  private cartItemSaleAvailableQty(item: CartItem): number {
    //console.log("[cart-modal.component-cartItemSaleAvailableQty] function called");
    const availQty = this.cartService.getAvailableNftQuantity(item);
    //console.log("[cart-modal.component] cartItemSaleAvailableQty, qty: " + availQty);
    return availQty;
  }

  public handleClose(): void {
    this.cartService.hideCart();
  }

  /*
  public handleCheckout(): void {
    const cartItems = this.cartService.getCartItems().getValue();
    //console.log('Proceeding to checkout with items:', cartItems);

    this.modalService.create({
      nzTitle: 'Checkout',
      nzContent: CheckoutOverlayComponent,
      nzComponentParams: {
        items: cartItems
      },
      nzFooter: null,
      nzWidth: '80%'
    });
  }
  */

  public handleCartCheckout(): void {
    const cartItems = this.cartService.getCartItems().getValue();

    this.modalService.create({
      nzTitle: 'Checkout',
      nzContent: CheckoutOverlayComponent,
      nzComponentParams: { items: cartItems },
      nzFooter: null,
      nzWidth: '80%',
      nzOnOk: () => this.isCartCheckoutOpen = false  // Optionally handle the modal close event
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
