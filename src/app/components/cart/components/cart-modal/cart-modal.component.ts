import {
  Component,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { Network, Transaction } from '@build-5/interfaces';
import { Subscription, take, of, Observable, BehaviorSubject, Subject } from 'rxjs';
import { CartService, CartItem } from '@components/cart/services/cart.service';
import { AuthService } from '@components/auth/services/auth.service';
import { Router } from '@angular/router';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UnitsService } from '@core/services/units/units.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { DeviceService } from '@core/services/device';
import { HelperService } from '@pages/nft/services/helper.service';
import {} from '@angular/core';

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
  public isLoadingCartData = true;

  public cartItems$!: Observable<CartItem[]>;
  public cartItemsStatus$!: Observable<{ [key: string]: { status: string; message: string } }>;

  public cartModalOpen$ = this.cartService.cartModalOpen$;
  public currentStep$ = this.cartService.currentStep$;

  public selectedNetwork$ = this.cartService.selectedNetwork$;

  public memberSpaces$ = this.cartService.memberSpaces$;
  public memberGuardianSpaces$ = this.cartService.memberGuardianSpaces$;
  public memberAwards$ = this.cartService.memberAwards$;

  public isLoading$ = this.cartService.isLoading$;

  public currentStep: StepType | null = null;
  public isTransactionExpired: boolean | null = null;
  public selectedNetwork: string | null = null;
  public isLoading = false;
  public pendingTransaction: Transaction | undefined = undefined;

  constructor(
    public cartService: CartService,
    private cd: ChangeDetectorRef,
    public auth: AuthService,
    private router: Router,
    public unitsService: UnitsService,
    public deviceService: DeviceService,
    public helper: HelperService,
  ) {}

  ngOnInit() {
    this.subscriptions$.add(
      this.cartService.currentStep$.subscribe((step) => {
        this.currentStep = step;
        this.triggerChangeDetection();
      }),
    );

    this.subscriptions$.add(
      this.cartService.selectedNetwork$.subscribe((network) => {
        this.selectedNetwork = network;
        this.triggerChangeDetection();
      }),
    );

    this.subscriptions$.add(
      this.cartService.pendingTransaction$.subscribe((transaction) => {
        this.pendingTransaction = transaction;
        this.triggerChangeDetection();
      }),
    );

    this.subscriptions$.add(
      this.cartService.isLoading$.subscribe((loading) => {
        this.isLoading = loading;
        this.triggerChangeDetection();
      }),
    );

    this.subscriptions$.add(
      this.cartService.cartUpdateObservable$.subscribe(() => {
        this.triggerChangeDetection();
      }),
    );

    this.subscriptions$.add(
      this.cartService.triggerChangeDetectionSubject$.subscribe(() => {
        this.triggerChangeDetection();
      }),
    );
  }

  public triggerChangeDetection(): void {
    this.cd.markForCheck();
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.nft.uid;
  }

  public removeFromCart(item: CartItem): void {
    this.cartService.removeFromCart(item);
  }

  public updateQuantity(event: Event, itemId: string): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = Math.round(Number(inputElement.value));

    newQuantity = Math.max(1, newQuantity);

    this.cartService
      .getCartItems()
      .pipe(
        take(1),
        switchMap((cartItems) => {
          const item = cartItems.find((item) => item.nft.uid === itemId);
          if (item) {
            return this.cartService.getAvailableNftQuantity(item).pipe(
              map((maxQuantity) => ({ item, maxQuantity })),
              tap(({ maxQuantity }) => {
                newQuantity = Math.min(newQuantity, maxQuantity);
                inputElement.value = String(newQuantity);
              }),
            );
          } else {
            return of(null);
          }
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.cartService.updateCartItemQuantity(itemId, newQuantity);
        }
      });
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
    this.cd.markForCheck();
  }

  public closeCheckoutOverlay(): void {
    this.cartService.closeCheckoutOverlay();
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }
}
