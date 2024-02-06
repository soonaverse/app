import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, map } from 'rxjs';
import {
  Nft,
  Collection,
  Transaction,
  MIN_AMOUNT_TO_TRANSFER,
  TRANSACTION_AUTO_EXPIRY_MS,
  DEFAULT_NETWORK,
  Space,
  Award,
  CollectionStatus,
} from '@build-5/interfaces';
import { getItem, setItem, removeItem, StorageItem, getCheckoutTransaction } from '@core/utils';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HelperService } from '@pages/nft/services/helper.service';
import { AuthService } from '@components/auth/services/auth.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { CheckoutOverlayComponent } from '../components/checkout/checkout-overlay.component';
import { OrderApi } from '@api/order.api';
import { SpaceApi } from '@api/space.api';
import { MemberApi } from '@api/member.api';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import dayjs from 'dayjs';

export interface CartItem {
  nft: Nft;
  collection: Collection;
  quantity: number;
  salePrice: number;
}

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  COMPLETE = 'Complete',
}

@Injectable({
  providedIn: 'root',
})
@UntilDestroy()
export class CartService {
  private cartItemsSubject$ = new BehaviorSubject<CartItem[]>(this.loadCartItems());
  private cartModalOpenSubject$ = new BehaviorSubject<boolean>(false);
  public cartModalOpen$ = this.cartModalOpenSubject$.asObservable();
  public checkoutOverlayOpenSubject$ = new BehaviorSubject<boolean>(false);
  public checkoutOverlayOpen$ = this.checkoutOverlayOpenSubject$.asObservable();
  private currentStepSubject$ = new BehaviorSubject<StepType>(StepType.CONFIRM);
  public currentStep$ = this.currentStepSubject$.asObservable();
  private checkoutOverlayModalRef: NzModalRef | null = null;
  private pendingTransaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  private memberSpaces: string[] = [];
  private memberGuardianSpaces: string[] = [];
  private memberAwards: string[] = [];
  private guardianSpaceSubscriptions$: { [key: string]: Subscription } = {};

  constructor(
    private notification: NzNotificationService,
    private helperService: HelperService,
    public auth: AuthService,
    private modalService: NzModalService,
    private orderApi: OrderApi,
    private spaceApi: SpaceApi,
    private memberApi: MemberApi,
  ) {
    this.subscribeToMemberChanges();
  }

  private subscribeToMemberChanges() {
    this.auth.member$.pipe(untilDestroyed(this)).subscribe((member) => {
      if (member) {
        this.refreshMemberData();
      } else {
        this.resetMemberData();
      }
    });
  }

  private refreshMemberData() {
    if (this.auth.member$.value?.uid) {
      this.loadMemberSpaces(this.auth.member$.value?.uid);
      this.loadMemberAwards(this.auth.member$.value?.uid);
    } else {
      this.resetMemberData();
    }
  }

  private resetMemberData() {
    this.memberSpaces = [];
    this.memberGuardianSpaces = [];
    this.memberAwards = [];
    this.cleanupGuardianSubscriptions();
  }

  private loadMemberSpaces(memberId: string): void {
    this.memberApi
      .allSpacesAsMember(memberId)
      .pipe(untilDestroyed(this))
      .subscribe((spaces) => {
        if (spaces) {
          this.memberSpaces = spaces.map((space) => space.uid);
          this.updateMemberSpaces(this.memberSpaces);
        }
      });
  }

  private loadMemberAwards(memberId: string): void {
    this.memberApi
      .topAwardsCompleted(memberId)
      .pipe(untilDestroyed(this))
      .subscribe((awards) => {
        if (awards) {
          this.memberAwards = awards.map((award) => award.uid);
          this.updateMemberAwards(this.memberAwards);
        }
      });
  }

  private updateMemberSpaces(spaces: string[]) {
    this.memberSpaces = spaces.map((space) => space);
    this.memberGuardianSpaces = [];
    spaces.forEach((space) => this.updateMemberGuardianStatus(space));
  }

  private updateMemberAwards(awards: string[]) {
    this.memberAwards = awards.map((award) => award);
  }

  private updateMemberGuardianStatus(spaceId: string) {
    if (this.auth.member$.value?.uid) {
      this.guardianSpaceSubscriptions$[spaceId]?.unsubscribe();
      this.guardianSpaceSubscriptions$[spaceId] = this.spaceApi
        .isGuardianWithinSpace(spaceId, this.auth.member$.value?.uid)
        .pipe(untilDestroyed(this))
        .subscribe((isGuardian) => {
          if (isGuardian && !this.memberGuardianSpaces.includes(spaceId)) {
            this.memberGuardianSpaces.push(spaceId);
          } else if (!isGuardian && this.memberGuardianSpaces.includes(spaceId)) {
            this.memberGuardianSpaces = this.memberGuardianSpaces.filter((id) => id !== spaceId);
          }
        });
    }
  }

  private cleanupGuardianSubscriptions() {
    Object.values(this.guardianSpaceSubscriptions$).forEach((subscription) =>
      subscription.unsubscribe(),
    );
    this.guardianSpaceSubscriptions$ = {};
  }

  public hasPendingTransaction(): boolean {
    const checkoutTransaction = getCheckoutTransaction();
    const transactionId = checkoutTransaction?.transactionId;
    return !!transactionId;
  }

  public setCurrentTransaction(transactionId: string): void {
    if (transactionId === null || transactionId === undefined) {
      return;
    }

    this.orderApi
      .listen(transactionId)
      .pipe(untilDestroyed(this))
      .subscribe((transaction) => {
        this.pendingTransaction$.next(transaction);
      });
  }

  public getCurrentTransaction(): Observable<Transaction | undefined> {
    return this.pendingTransaction$.asObservable();
  }

  public setCurrentStep(step: StepType): void {
    this.currentStepSubject$.next(step);
  }

  public getCurrentStep(): StepType {
    return this.currentStepSubject$.getValue();
  }

  public showCartModal(): void {
    this.cartModalOpenSubject$.next(true);
  }

  public hideCartModal(): void {
    this.cartModalOpenSubject$.next(false);
  }

  public isCartModalOpen(): boolean {
    return this.cartModalOpenSubject$.getValue();
  }

  public openCheckoutOverlay(): void {
    if (!this.checkoutOverlayOpenSubject$.getValue()) {
      const checkoutTransaction = getCheckoutTransaction();

      if (checkoutTransaction && checkoutTransaction.transactionId) {
        if (checkoutTransaction.source === 'nftCheckout') {
          this.notification.error(
            'You currently have an open order. Pay for it or let it expire.',
            '',
          );
          return;
        }

        if (checkoutTransaction.source === 'cartCheckout') {
          this.setCurrentTransaction(checkoutTransaction.transactionId);
          const currentTransaction = this.pendingTransaction$.getValue();

          if (currentTransaction && currentTransaction.uid) {
            const expiresOn: dayjs.Dayjs = dayjs(currentTransaction.createdOn!.toDate()).add(
              TRANSACTION_AUTO_EXPIRY_MS,
              'ms',
            );

            if (
              expiresOn.isBefore(dayjs()) ||
              currentTransaction.payload?.void ||
              currentTransaction.payload?.reconciled
            ) {
              removeItem(StorageItem.CheckoutTransaction);
              this.pendingTransaction$.next(undefined);
              this.setCurrentStep(StepType.CONFIRM);
            }
          }
        } else {
          this.notification.error(
            'CheckoutTransaction exists and source is not nftCheckout, the checkout-overlay is not open and the pending transaction not expired or complete and the source is not cartCheckout, this should never happen.',
            '',
          );
          return;
        }
      }

      const cartItems = this.getCartItems().getValue();

      this.checkoutOverlayModalRef = this.modalService.create({
        nzTitle: 'Checkout',
        nzContent: CheckoutOverlayComponent,
        nzComponentParams: { items: cartItems },
        nzFooter: null,
        nzWidth: '80%',
      });

      this.checkoutOverlayModalRef.afterClose.subscribe(() => {
        this.closeCheckoutOverlay();
      });

      this.checkoutOverlayOpenSubject$.next(true);
    }
  }

  public closeCheckoutOverlay(): void {
    const checkoutTransaction = getCheckoutTransaction();
    if (checkoutTransaction && checkoutTransaction.transactionId) {
      if (checkoutTransaction.source === 'cartCheckout') {
        this.setCurrentTransaction(checkoutTransaction.transactionId);
        const currentTransaction = this.pendingTransaction$.getValue();
        if (this.checkoutOverlayModalRef) {
          const currentStep = this.getCurrentStep();
          if (currentStep === StepType.TRANSACTION || currentStep === StepType.WAIT) {
            if (currentTransaction && currentTransaction.uid) {
              const expiresOn: dayjs.Dayjs = dayjs(currentTransaction.createdOn!.toDate()).add(
                TRANSACTION_AUTO_EXPIRY_MS,
                'ms',
              );

              if (
                expiresOn.isBefore(dayjs()) ||
                currentTransaction.payload?.void ||
                currentTransaction.payload?.reconciled
              ) {
                removeItem(StorageItem.CheckoutTransaction);
                this.pendingTransaction$.next(undefined);
                this.setCurrentStep(StepType.CONFIRM);
              }
            } else {
              removeItem(StorageItem.CheckoutTransaction);
              this.pendingTransaction$.next(undefined);
              this.setCurrentStep(StepType.CONFIRM);
            }

            this.checkoutOverlayModalRef.close();
            this.checkoutOverlayOpenSubject$.next(false);
            this.checkoutOverlayModalRef = null;
          } else {
            this.checkoutOverlayModalRef.close();
            this.checkoutOverlayOpenSubject$.next(false);
            this.checkoutOverlayModalRef = null;
          }
        } else {
          this.checkoutOverlayOpenSubject$.next(false);
        }
      } else {
        if (this.checkoutOverlayModalRef) {
          this.checkoutOverlayModalRef.close();
          this.checkoutOverlayOpenSubject$.next(false);
          this.checkoutOverlayModalRef = null;
          this.setCurrentStep(StepType.CONFIRM);
        }
        this.checkoutOverlayOpenSubject$.next(false);
      }
    } else {
      if (this.checkoutOverlayModalRef) {
        this.checkoutOverlayModalRef.close();
        this.checkoutOverlayOpenSubject$.next(false);
        this.checkoutOverlayModalRef = null;
        this.pendingTransaction$.next(undefined);
        this.setCurrentStep(StepType.CONFIRM);
      }
      this.checkoutOverlayOpenSubject$.next(false);
    }
  }

  public isCheckoutOverlayOpen(): boolean {
    return this.checkoutOverlayOpenSubject$.getValue();
  }

  public openCartAndCheckoutOverlay(): void {
    const wasCartModalOpen = this.cartModalOpenSubject$.getValue();

    if (!wasCartModalOpen) {
      this.showCartModal();
    }

    if (!this.checkoutOverlayOpenSubject$.getValue()) {
      if (!wasCartModalOpen) {
        setTimeout(() => {
          this.openCheckoutOverlay();
        }, 300);
      } else {
        this.openCheckoutOverlay();
      }
    }
  }

  public getCartItems(): BehaviorSubject<CartItem[]> {
    return this.cartItemsSubject$;
  }

  public addToCart(cartItem: CartItem): void {
    const currentItems = this.cartItemsSubject$.value;
    if (currentItems.length >= 100) {
      this.notification.error(
        $localize`Your cart is full. Please remove items before adding more.`,
        '',
      );
      return;
    }

    const isItemAlreadyInCart = currentItems.some((item) => item.nft.uid === cartItem.nft.uid);
    if (!isItemAlreadyInCart) {
      const updatedCartItems = [...currentItems, cartItem];
      this.cartItemsSubject$.next(updatedCartItems);
      this.saveCartItems();
      this.notification.success(
        $localize`NFT ${cartItem.nft.name} from collection ${cartItem.collection.name} has been added to your cart.`,
        '',
      );
    } else {
      this.notification.error($localize`This NFT already exists in your cart.`, '');
    }
  }

  public refreshCartItems(): void {
    this.cartItemsSubject$.next(this.cartItemsSubject$.value);
  }

  public removeFromCart(cartItem: CartItem): void {
    const updatedCartItems = this.cartItemsSubject$.value.filter(
      (item) => item.nft.uid !== cartItem.nft.uid,
    );
    this.cartItemsSubject$.next(updatedCartItems);
    this.saveCartItems();
    this.notification.success(
      $localize`NFT ${cartItem.nft.name} from collection ${cartItem.collection.name} has been removed from your cart.`,
      '',
    );
  }

  public removeItemsFromCart(itemIds: string[]): void {
    const updatedCartItems = this.cartItemsSubject$.value.filter(
      (item) => !itemIds.includes(item.nft.uid),
    );
    this.cartItemsSubject$.next(updatedCartItems);
    this.saveCartItems();
  }

  public removeGroupItemsFromCart(tokenSymbol: string): void {
    const updatedCartItems = this.cartItemsSubject$.value.filter((item) => {
      const itemTokenSymbol =
        (item.nft?.placeholderNft
          ? item.collection?.mintingData?.network
          : item.nft?.mintingData?.network) || DEFAULT_NETWORK;
      return itemTokenSymbol !== tokenSymbol;
    });
    this.cartItemsSubject$.next(updatedCartItems);
    this.saveCartItems();
  }

  public isNftAvailableForSale(
    nft: Nft,
    collection: Collection,
  ): { isAvailable: boolean; message: string } {
    let message = 'NFT is available for sale.';
    const conditions: string[] = [];

    let isAvailable = false;

    if (!collection) {
      message = 'Internal Error: Collection data is null or undefined.';
      return { isAvailable, message };
    }

    if (!nft?.availableFrom) {
      message = 'Internal Error: Nft and/or NFT Available From date is null or undefined.';
      return { isAvailable, message };
    }

    let validAvailableFromDate =
      !!this.helperService.getDate(nft.availableFrom) &&
      dayjs(this.helperService.getDate(nft.availableFrom)).isSameOrBefore(dayjs(), 's');
    if (!validAvailableFromDate) {
      validAvailableFromDate =
        !!this.helperService.getDate(collection.availableFrom) &&
        dayjs(this.helperService.getDate(collection.availableFrom)).isSameOrBefore(dayjs(), 's');
    }
    if (!validAvailableFromDate) conditions.push('NFT does not have a valid "availableFrom" date.');

    const collectionApproved = collection.approved;
    if (!collectionApproved) conditions.push('Collection is not Approved.');

    const collectionStatusMinting = collection?.status === CollectionStatus.MINTING;
    if (collectionStatusMinting) conditions.push('Collection is in minting status.');

    const isLocked = this.helperService.isLocked(nft, collection, true);
    if (isLocked) conditions.push('NFT is locked.');

    const saleAccessMembersBlocked =
      (nft?.saleAccessMembers?.length ?? 0) > 0 &&
      !nft?.saleAccessMembers?.includes(this.auth.member$.value?.uid ?? '');
    if (saleAccessMembersBlocked) conditions.push('Sale access is blocked for this member.');

    let isOwner = false;
    if (nft.owner != null && this.auth.member$.value?.uid != null) {
      isOwner = nft.owner === this.auth.member$.value?.uid;
    }
    if (isOwner) conditions.push('You are the owner of this NFT.');

    const availableValue = +nft?.available;
    const nftAvailable = availableValue === 1 || availableValue === 3;
    if (!nftAvailable) conditions.push('NFT is not marked as available.');

    const spaceMemberAccess =
      collection?.access !== 1 ||
      (collection?.access === 1 && this.memberSpaces.includes(collection?.space ?? ''));
    if (!spaceMemberAccess) conditions.push('Member does not have access to this space.');

    const spaceGuardianAccess =
      collection?.access !== 2 ||
      (collection?.access === 2 && this.memberGuardianSpaces.includes(collection?.space ?? ''));
    if (!spaceGuardianAccess) conditions.push('Member is not a guardian of this space.');

    const spaceAwardAccess =
      collection?.access !== 3 ||
      (collection?.access === 3 &&
        collection?.accessAwards?.some((award) => this.memberAwards.includes(award)));
    if (!spaceAwardAccess) conditions.push('Member does not have the required awards for access.');

    isAvailable =
      !collectionStatusMinting &&
      collectionApproved &&
      validAvailableFromDate &&
      !isLocked &&
      !saleAccessMembersBlocked &&
      (!isOwner || !nft.owner) &&
      nftAvailable &&
      spaceMemberAccess &&
      spaceGuardianAccess &&
      spaceAwardAccess;

    if (!isAvailable && conditions.length > 0) {
      message =
        'NFT is not available for sale due to the following conditions: ' + conditions.join(' ');
    }

    return { isAvailable, message };
  }

  public clearCart(): void {
    this.cartItemsSubject$.next([]);
    this.saveCartItems();
    this.notification.success($localize`All items have been removed from your cart.`, '');
  }

  public isCartItemAvailableForSale(cartItem: CartItem): { isAvailable: boolean; message: string } {
    const isAvailable = this.isNftAvailableForSale(cartItem.nft, cartItem.collection).isAvailable;
    const message = this.isNftAvailableForSale(cartItem.nft, cartItem.collection).message;
    return { isAvailable, message };
  }

  public getAvailableNftQuantity(cartItem: CartItem): number {
    const isAvailableForSale = this.helperService.isAvailableForSale(
      cartItem.nft,
      cartItem.collection,
    );

    if (cartItem.nft.placeholderNft && isAvailableForSale) {
      return cartItem.collection.availableNfts || 0;
    } else if (isAvailableForSale) {
      return 1;
    }
    return 0;
  }

  public updateCartItems(updatedItems: CartItem[]): void {
    this.cartItemsSubject$.next(updatedItems);
    this.saveCartItems();
  }

  public saveCartItems(): void {
    setItem(StorageItem.CartItems, this.cartItemsSubject$.value);
  }

  public loadCartItems(): CartItem[] {
    const items = getItem(StorageItem.CartItems) as CartItem[];
    return items || [];
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
}
