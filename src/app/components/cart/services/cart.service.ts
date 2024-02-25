import { Injectable, NgZone } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  map,
  of,
  take,
  tap,
  catchError,
  finalize,
  combineLatest,
} from 'rxjs';
import {
  Nft,
  Collection,
  Transaction,
  MIN_AMOUNT_TO_TRANSFER,
  TRANSACTION_AUTO_EXPIRY_MS,
  DEFAULT_NETWORK,
  getDefDecimalIfNotSet,
  CollectionStatus,
  DEFAULT_NETWORK_DECIMALS,
  Network,
  COL,
  Timestamp,
} from '@build-5/interfaces';
import { getItem, removeItem, StorageItem, getCheckoutTransaction } from '@core/utils';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HelperService } from '@pages/nft/services/helper.service';
import { AuthService } from '@components/auth/services/auth.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { CheckoutOverlayComponent } from '@components/cart/components/checkout/checkout-overlay.component';
import { OrderApi } from '@api/order.api';
import { SpaceApi } from '@api/space.api';
import { MemberApi } from '@api/member.api';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import dayjs from 'dayjs';
import { NftApi } from '@api/nft.api';
import { FilterStorageService } from '@core/services/filter-storage';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { InstantSearchConfig } from 'angular-instantsearch/instantsearch/instantsearch';

export interface CartItem {
  nft: Nft;
  collection: Collection;
  quantity: number;
  salePrice: number;
  pricing: {
    originalPrice: number;
    discountedPrice: number;
    tokenSymbol: Network;
  };
}

export interface ConvertValue {
  value: number | null | undefined;
  exponents: number | null | undefined;
}

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  COMPLETE = 'Complete',
}

export const CART_STORAGE_KEY = 'App/cartItems';

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
  private memberSpacesSubject$ = new BehaviorSubject<string[]>([]);
  private memberGuardianSpacesSubject$ = new BehaviorSubject<string[]>([]);
  private memberAwardsSubject$ = new BehaviorSubject<string[]>([]);
  private memberNftCollectionIdsSubject$ = new BehaviorSubject<string[]>([]);
  private guardianSpaceSubscriptions$: { [key: string]: Subscription } = {};
  private isLoadingSubject$ = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject$.asObservable();
  public config?: InstantSearchConfig;
  private selectedNetworkSubject$ = new BehaviorSubject<string | null>(this.getSelectedNetwork());
  public selectedNetwork$ = this.selectedNetworkSubject$.asObservable();

  constructor(
    private notification: NzNotificationService,
    private helperService: HelperService,
    public auth: AuthService,
    private modalService: NzModalService,
    private orderApi: OrderApi,
    private spaceApi: SpaceApi,
    private memberApi: MemberApi,
    private zone: NgZone,
    private nftApi: NftApi,
    public filterStorageService: FilterStorageService,
    public readonly algoliaService: AlgoliaService,
  ) {
    this.subscribeToMemberChanges();
    this.listenToStorageChanges();
    this.listenToNetworkSelectionChanges();
  }

  private listenToStorageChanges(): void {
    window.addEventListener('storage', (event) => {
      if (event.storageArea === localStorage && event.key === CART_STORAGE_KEY) {
        this.zone.run(() => {
          const updatedCartItems = JSON.parse(event.newValue || '[]');
          this.cartItemsSubject$.next(updatedCartItems);
        });
      }
    });
  }

  private listenToNetworkSelectionChanges(): void {
    window.addEventListener('storage', (event) => {
      if (event.storageArea === localStorage && event.key === 'cartCheckoutSelectedNetwork') {
        this.zone.run(() => {
          const updatedNetwork = localStorage.getItem('cartCheckoutSelectedNetwork');
          this.selectedNetworkSubject$.next(updatedNetwork);
        });
      }
    });
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
    const memberId = this.auth.member$.value?.uid;
    if (memberId) {
      this.loadMemberSpaces(memberId);
      this.loadMemberAwards(memberId);
      this.loadMemberNfts(memberId);
    } else {
      this.resetMemberData();
    }
  }

  private resetMemberData() {
    this.memberSpacesSubject$.next([]);
    this.memberGuardianSpacesSubject$.next([]);
    this.memberAwardsSubject$.next([]);
    this.memberNftCollectionIdsSubject$.next([]);
    this.cleanupGuardianSubscriptions();
  }

  private loadMemberSpaces(memberId: string): void {
    this.memberApi
      .allSpacesAsMember(memberId)
      .pipe(
        untilDestroyed(this),
        map((spaces) => spaces.map((space) => space.uid)),
      )
      .subscribe((spaceIds) => {
        this.memberSpacesSubject$.next(spaceIds);
        spaceIds.forEach((spaceId) => this.updateMemberGuardianStatus(spaceId));
      });
  }

  private loadMemberAwards(memberId: string): void {
    this.memberApi
      .topAwardsCompleted(memberId)
      .pipe(
        untilDestroyed(this),
        map((awards) => awards.map((award) => award.uid)),
      )
      .subscribe((awardIds) => {
        this.memberAwardsSubject$.next(awardIds);
      });
  }

  private loadMemberNfts(memberId: string): void {
    this.algoliaService
      .fetchAllOwnedNfts(memberId, COL.NFT)
      .then((nfts) => {
        const results = this.convertAllToSoonaverseModel(nfts);

        const collectionIds = results
          .map((hit) => hit.collection)
          .filter((value, index, self) => self.indexOf(value) === index);
        const currentIds = this.memberNftCollectionIdsSubject$.getValue();
        const allIds = [...new Set([...currentIds, ...collectionIds])];
        this.memberNftCollectionIdsSubject$.next(allIds);
      })
      .catch((error) => {
        console.error('Error fetching owned NFTs:', error);
      });
  }

  public convertAllToSoonaverseModel(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => ({
      ...algolia,
      availableFrom: Timestamp.fromMillis(+algolia.availableFrom),
    }));
  }

  private updateMemberGuardianStatus(spaceId: string) {
    if (this.auth.member$.value?.uid) {
      this.guardianSpaceSubscriptions$[spaceId]?.unsubscribe();
      this.guardianSpaceSubscriptions$[spaceId] = this.spaceApi
        .isGuardianWithinSpace(spaceId, this.auth.member$.value?.uid)
        .pipe(untilDestroyed(this))
        .subscribe((isGuardian) => {
          this.updateGuardianSpaces(isGuardian, spaceId);
        });
    }
  }

  private updateGuardianSpaces(isGuardian: boolean, spaceId: string) {
    let currentGuardianSpaces = this.memberGuardianSpacesSubject$.getValue();
    if (isGuardian && !currentGuardianSpaces.includes(spaceId)) {
      currentGuardianSpaces.push(spaceId);
    } else if (!isGuardian && currentGuardianSpaces.includes(spaceId)) {
      currentGuardianSpaces = currentGuardianSpaces.filter((id) => id !== spaceId);
    }
    this.memberGuardianSpacesSubject$.next(currentGuardianSpaces);
  }

  private cleanupGuardianSubscriptions() {
    Object.values(this.guardianSpaceSubscriptions$).forEach((subscription) =>
      subscription.unsubscribe(),
    );
    this.guardianSpaceSubscriptions$ = {};
  }

  get memberSpaces$(): Observable<string[]> {
    return this.memberSpacesSubject$.asObservable();
  }

  get memberGuardianSpaces$(): Observable<string[]> {
    return this.memberGuardianSpacesSubject$.asObservable();
  }

  get memberAwards$(): Observable<string[]> {
    return this.memberAwardsSubject$.asObservable();
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
    localStorage.setItem('cartCheckoutCurrentStep', step);
  }

  public getCurrentStep(): StepType {
    return this.currentStepSubject$.getValue();
  }

  public showCartModal(): void {
    this.isLoadingSubject$.next(true);

    const cartItems = this.cartItemsSubject$.getValue();
    if (cartItems.length === 0) {
      this.isLoadingSubject$.next(false);
      this.cartModalOpenSubject$.next(true);
      return;
    }

    const freshDataObservables = cartItems.map((item) =>
      this.nftApi.getNftById(item.nft.uid).pipe(
        take(1),
        map((freshNft) => (freshNft ? { ...item, nft: freshNft } : item)),
        catchError(() => of(item)),
      ),
    );

    combineLatest(freshDataObservables)
      .pipe(
        take(1),
        finalize(() => this.isLoadingSubject$.next(false)),
      )
      .subscribe((updatedCartItems) => {
        this.cartItemsSubject$.next(updatedCartItems);
        this.cartModalOpenSubject$.next(true);
      });
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
          this.getCurrentTransaction()
            .pipe(take(1))
            .subscribe((currentTransaction) => {
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
                  this.openModal();
                } else {
                  this.openModal();
                }
              } else {
                this.openModal();
              }
            });
        } else {
          this.notification.error(
            'CheckoutTransaction exists and source is not nftCheckout, the checkout-overlay is not open and the pending transaction not expired or complete and the source is not cartCheckout, this should never happen.',
            '',
          );
          return;
        }
      } else {
        this.openModal();
      }
    }
  }

  private openModal(): void {
    this.getCartItems()
      .pipe(take(1))
      .subscribe((cartItems) => {
        if (cartItems.length > 0) {
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
      });
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

  public getCartItems(): Observable<CartItem[]> {
    return this.cartItemsSubject$.asObservable();
  }

  public cartItemStatus(item: CartItem): Observable<{ status: string; message: string }> {
    return this.isCartItemAvailableForSale(item).pipe(
      map((availabilityResult) => ({
        status: availabilityResult.isAvailable ? 'Available' : 'Not Available',
        message: availabilityResult.message,
      })),
    );
  }

  public addToCart(nft: Nft, collection: Collection, quantity = 1, hideNotif = false): void {
    const currentItems = this.cartItemsSubject$.getValue();

    if (currentItems.length >= 100) {
      this.notification.error('You cannot add more than 100 unique NFTs to your cart.', '');
      return;
    }

    const existingItemIndex = currentItems.findIndex((item) => item.nft.uid === nft.uid);

    if (existingItemIndex > -1) {
      this.notification.error('This NFT already exists in your cart.', '');
      return;
    }

    const discountRate = this.discount(collection, nft);
    const originalPrice = this.calcPrice(nft, 1);
    const discountedPrice = this.calcPrice(nft, discountRate);
    const tokenSymbol =
      (nft.placeholderNft ? collection.mintingData?.network : nft.mintingData?.network) ||
      DEFAULT_NETWORK;

    const cartItem: CartItem = {
      nft: nft,
      collection: collection,
      quantity: quantity,
      salePrice: discountRate < 1 ? discountedPrice : originalPrice,
      pricing: {
        originalPrice,
        discountedPrice,
        tokenSymbol,
      },
    };

    const updatedCartItems = [...currentItems, cartItem];
    this.cartItemsSubject$.next(updatedCartItems);
    this.saveCartItems();

    if (hideNotif === false) {
      this.notification.success(
        `NFT ${nft.name} from collection ${collection.name} has been added to your cart.`,
        '',
      );
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

  public calcPrice(nft: Nft, discount: number): number {
    const itemPrice = nft?.availablePrice || nft?.price || 0;
    return this.calc(itemPrice, discount);
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

  public updateCartItemQuantity(itemId: string, newQuantity: number): void {
    this.cartItemsSubject$
      .pipe(
        take(1),
        tap((cartItems) => {
          const updatedCartItems = cartItems.map((item) => {
            if (item.nft.uid === itemId) {
              return { ...item, quantity: newQuantity };
            }
            return item;
          });

          this.cartItemsSubject$.next(updatedCartItems);

          this.saveCartItems();
        }),
      )
      .subscribe();
  }

  public isNftAvailableForSale(
    nft: Nft,
    collection: Collection,
    checkCartPresence = false,
    checkPendingTransaction = true,
  ): Observable<{ isAvailable: boolean; message: string }> {
    let message = 'NFT is available for sale.';
    const conditions: string[] = [];

    let isAvailable = false;

    const memberSpaces = this.memberSpacesSubject$.getValue();
    const memberGuardianSpaces = this.memberGuardianSpacesSubject$.getValue();
    const memberAwards = this.memberAwardsSubject$.getValue();
    const memberNftCollectionIds = this.memberNftCollectionIdsSubject$.getValue();

    if (checkPendingTransaction) {
      const pendingTrx = this.hasPendingTransaction();
      if (pendingTrx) {
        message =
          'Finish pending cart checkout transaction or wait for it to expire before adding more items to cart.';
        return of({
          isAvailable,
          message,
        });
      }
    }

    if (checkCartPresence) {
      const isNftInCart = this.cartItemsSubject$
        .getValue()
        .some((cartItem) => cartItem.nft.uid === nft.uid);
      if (isNftInCart) {
        message = 'This NFT is already in your cart.';
        return of({
          isAvailable,
          message,
        });
      }
    }

    if (!collection) {
      message = 'Internal Error: Collection data is null or undefined.';
      return of({
        isAvailable,
        message,
      });
    }

    if (!nft?.availableFrom) {
      message = 'Internal Error: Nft and/or NFT Available From date is null or undefined.';
      return of({
        isAvailable,
        message,
      });
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
    const nftAvailable =
      availableValue === 1 ||
      availableValue === 3 ||
      nft?.available === null ||
      nft?.available === undefined;
    if (!nftAvailable) conditions.push('NFT is not marked as available.');

    let spaceMemberAccess = true;
    let spaceGuardianAccess = true;
    let spaceAwardAccess = true;
    let nftOwnedAccess = true;

    if (nft?.isOwned === false) {
      spaceMemberAccess =
        collection?.access !== 1 ||
        (collection?.access === 1 && memberSpaces.includes(collection?.space ?? ''));
      if (!spaceMemberAccess) conditions.push('Member does not have access to this space.');

      spaceGuardianAccess =
        collection?.access !== 2 ||
        (collection?.access === 2 && memberGuardianSpaces.includes(collection?.space ?? ''));
      if (!spaceGuardianAccess) conditions.push('Member is not a guardian of this space.');

      spaceAwardAccess =
        collection?.access !== 3 ||
        (collection?.access === 3 &&
          collection?.accessAwards?.some((award) => memberAwards.includes(award)));
      if (!spaceAwardAccess)
        conditions.push('Member does not have the required awards for access.');

      nftOwnedAccess =
        collection?.access !== 4 ||
        (collection?.access === 4 &&
          collection?.accessCollections?.every((coll) => memberNftCollectionIds.includes(coll)));
      if (!nftOwnedAccess)
        conditions.push(
          'Member does not own at least one NFT from each of the required access collections.',
        );
    }

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
      spaceAwardAccess &&
      nftOwnedAccess;

    if (!isAvailable && conditions.length > 0) {
      message =
        'NFT is not available for sale due to the following conditions: ' + conditions.join(' ');
    }

    return of({
      isAvailable,
      message,
    });
  }

  public isCartItemAvailableForSale(
    cartItem: CartItem,
    checkCartPresence = false,
  ): Observable<{ isAvailable: boolean; message: string }> {
    return this.isNftAvailableForSale(
      cartItem.nft,
      cartItem.collection,
      checkCartPresence,
      false,
    ).pipe(
      map((result) => {
        return {
          isAvailable: result.isAvailable,
          message: result.message,
        };
      }),
    );
  }

  public clearCart(): void {
    this.cartItemsSubject$.next([]);
    this.saveCartItems();
    this.notification.success($localize`All items have been removed from your cart.`, '');
  }

  public getAvailableNftQuantity(cartItem: CartItem): Observable<number> {
    return this.isCartItemAvailableForSale(cartItem).pipe(
      map((result) => {
        if (result.isAvailable) {
          return cartItem.nft.placeholderNft ? cartItem.collection.availableNfts || 0 : 1;
        } else {
          return 0;
        }
      }),
      map((quantity) => (quantity === null ? 0 : quantity)),
    );
  }

  public saveCartItems(): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItemsSubject$.getValue()));
  }

  public loadCartItems(): CartItem[] {
    const items = getItem(StorageItem.CartItems) as CartItem[];
    return items || [];
  }

  public valueDivideExponent(value: ConvertValue): number {
    if (value.exponents === 0 || value.value === null || value.value === undefined) {
      return value.value!;
    } else {
      return value.value! / Math.pow(10, getDefDecimalIfNotSet(value.exponents));
    }
  }

  public getDefaultNetworkDecimals(): number {
    return DEFAULT_NETWORK_DECIMALS;
  }

  public getSelectedNetwork(): string | null {
    const selectedNetwork = localStorage.getItem('cartCheckoutSelectedNetwork');
    return selectedNetwork;
  }

  public setNetworkSelection(networkSymbol: string): void {
    localStorage.setItem('cartCheckoutSelectedNetwork', networkSymbol);
    this.selectedNetworkSubject$.next(networkSymbol);
  }

  public clearNetworkSelection(): void {
    localStorage.removeItem('cartCheckoutSelectedNetwork');
    this.selectedNetworkSubject$.next(null);
  }
}
