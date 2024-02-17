import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { CartItem, CartService } from '@components/cart/services/cart.service';
import {
  CollectionType,
  Nft,
  Timestamp,
  Transaction,
  TransactionType,
  TRANSACTION_AUTO_EXPIRY_MS,
  NftPurchaseRequest,
  Network,
  DEFAULT_NETWORK,
} from '@build-5/interfaces';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { OrderApi } from '@api/order.api';
import { NftApi } from '@api/nft.api';
import {
  BehaviorSubject,
  firstValueFrom,
  interval,
  Observable,
  Subscription,
  forkJoin,
  of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TransactionService } from '@core/services/transaction';
import {
  removeItem,
  StorageItem,
  setCheckoutTransaction,
  getCheckoutTransaction,
} from '@core/utils';
import dayjs from 'dayjs';
import { HelperService } from '@pages/nft/services/helper.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ThemeList, ThemeService } from '@core/services/theme';
import { UnitsService } from '@core/services/units/units.service';
import { DeviceService } from '@core/services/device';

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  COMPLETE = 'Complete',
}

interface GroupedCartItem {
  tokenSymbol: string;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  network: Network | undefined;
}

interface HistoryItem {
  uniqueId: string;
  date: dayjs.Dayjs | Timestamp | null;
  label: string;
  transaction?: Transaction;
  link?: string;
}

@UntilDestroy()
@Component({
  selector: 'wen-app-checkout-overlay',
  templateUrl: './checkout-overlay.component.html',
  styleUrls: ['./checkout-overlay.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutOverlayComponent implements OnInit, OnDestroy {
  @Input() currentStep = StepType.CONFIRM;
  @Input() items: CartItem[] = [];
  @Input() pendingTransaction: Transaction | undefined;

  @Output() wenOnClose = new EventEmitter<void>();
  @Output() wenOnCloseCartCheckout = new EventEmitter<boolean>();

  public groupedCartItems: GroupedCartItem[] = [];
  public unavailableItemCount = 0;
  public agreeTermsConditions = false;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public history: HistoryItem[] = [];
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public invalidPayment = false;
  public receivedTransactions = false;
  public targetAddress?: string;
  public targetAmount?: number;
  public purchasedNfts?: Nft[] | null;
  public stepType = StepType;
  public selectedNetwork: string | null = null;
  public mintingDataNetwork: Network | undefined;
  public formattedTotalPrice = '';
  private purchasedTokenSymbol: string | null = null;
  private transSubscription$?: Subscription;
  public nftPath = ROUTER_UTILS.config.nft.root;
  public collectionPath = ROUTER_UTILS.config.collection.root;
  public expandedGroups = new Set<string>();
  private currentTransactionSubscription?: Subscription;
  public theme = ThemeList;

  constructor(
    public cartService: CartService,
    public auth: AuthService,
    private notification: NotificationService,
    private orderApi: OrderApi,
    public transactionService: TransactionService,
    public helper: HelperService,
    private cd: ChangeDetectorRef,
    private nftApi: NftApi,
    private router: Router,
    private nzNotification: NzNotificationService,
    public themeService: ThemeService,
    public unitsService: UnitsService,
    public deviceService: DeviceService,
  ) {}

  public get themes(): typeof ThemeList {
    return ThemeList;
  }

  ngOnInit() {
    this.subscribeToCurrentStep();
    this.subscribeToCurrentTransaction();
    this.subscribeToCartItems();

    this.groupItems();
    this.receivedTransactions = false;
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        this.targetAmount = val.payload.amount;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          removeItem(StorageItem.CheckoutTransaction);
        }
        if (val.linkedTransactions && val.linkedTransactions?.length > 0) {
          this.currentStep = StepType.WAIT;
          this.updateStep(this.currentStep);
          for (const tranId of val.linkedTransactions) {
            if (listeningToTransaction.indexOf(tranId) > -1) {
              continue;
            }

            listeningToTransaction.push(tranId);
            this.orderApi
              .listen(tranId)
              .pipe(untilDestroyed(this))
              .subscribe(<any>this.transaction$);
          }
        } else if (!val.linkedTransactions || val.linkedTransactions.length === 0) {
          this.currentStep = StepType.TRANSACTION;
          this.updateStep(this.currentStep);
        }

        this.expiryTicker$.next(expiresOn);
      }

      if (val && val.type === TransactionType.PAYMENT && val.payload.reconciled === true) {
        this.pushToHistory(
          val,
          val.uid + '_payment_received',
          val.createdOn,
          $localize`Payment received.`,
          (<any>val).payload?.chainReference,
        );

        this.currentStep = StepType.COMPLETE;
        this.updateStep(this.currentStep);
        this.cd.markForCheck();
      }

      if (
        val &&
        val.type === TransactionType.PAYMENT &&
        val.payload.reconciled === true &&
        (<any>val).payload.invalidPayment === false
      ) {
        setTimeout(() => {
          this.pushToHistory(
            val,
            val.uid + '_confirming_trans',
            dayjs(),
            $localize`Confirming transaction.`,
          );
        }, 1000);

        setTimeout(() => {
          this.pushToHistory(
            val,
            val.uid + '_confirmed_trans',
            dayjs(),
            $localize`Transaction confirmed.`,
          );
          this.receivedTransactions = true;
          this.currentStep = StepType.COMPLETE;
          this.updateStep(this.currentStep);
          this.removePurchasedGroupItems();
          this.cd.markForCheck();
        }, 2000);

        if (val.payload.nftOrders && val.payload.nftOrders.length > 0) {
          this.purchasedNfts = this.purchasedNfts || [];
          val.payload.nftOrders.forEach((nftOrder) => {
            firstValueFrom(this.nftApi.listen(nftOrder.nft)).then((obj) => {
              if (obj !== null && obj !== undefined) {
                const purchasedNft = obj as Nft;

                this.purchasedNfts = [...(this.purchasedNfts || []), purchasedNft];
                this.cd.markForCheck();
              }
            });
          });
        }
      }

      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.ignoreWallet === false &&
        !val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(
          val,
          val.uid + '_false',
          val.createdOn,
          $localize`Invalid amount received. Refunding transaction...`,
        );
      }

      const markInvalid = () => {
        setTimeout(() => {
          this.currentStep = StepType.TRANSACTION;
          this.updateStep(this.currentStep);
          this.invalidPayment = true;
          this.cd.markForCheck();
        }, 2000);
      };

      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.ignoreWallet === true &&
        !val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(
          val,
          val.uid + '_false',
          val.createdOn,
          $localize`Invalid transaction.You must gift storage deposit.`,
        );
        markInvalid();
      }

      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(
          val,
          val.uid + '_true',
          dayjs(),
          $localize`Invalid payment refunded.`,
          val.payload?.walletReference?.chainReference,
        );

        markInvalid();
      }

      this.cd.markForCheck();
    });

    const checkoutTransaction = getCheckoutTransaction();
    if (checkoutTransaction && checkoutTransaction.transactionId) {
      this.transSubscription$ = this.orderApi
        .listen(checkoutTransaction.transactionId)
        .subscribe((transaction) => {
          this.transaction$.next(transaction);
        });
    } else {
      this.transSubscription$?.unsubscribe();
    }

    const int: Subscription = interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.expiryTicker$.next(this.expiryTicker$.value);

        if (this.expiryTicker$.value) {
          const expiresOn: dayjs.Dayjs = dayjs(this.expiryTicker$.value).add(
            TRANSACTION_AUTO_EXPIRY_MS,
            'ms',
          );
          if (expiresOn.isBefore(dayjs())) {
            this.expiryTicker$.next(null);
            removeItem(StorageItem.CheckoutTransaction);
            int.unsubscribe();
            this.reset();
          }
        }
      });

    if (this.currentStep === StepType.CONFIRM) {
      this.clearNetworkSelection();

      if (this.groupedCartItems.length === 1) {
        this.setNetworkSelection(this.groupedCartItems[0].tokenSymbol);
      }
    } else {
      const storedNetwork = localStorage.getItem('cartCheckoutSelectedNetwork');
      if (storedNetwork) {
        this.selectedNetwork = storedNetwork;
      }
    }
    this.setDefaultGroupVisibility();
  }

  private subscribeToCartItems() {
    this.cartService
      .getCartItems()
      .pipe(untilDestroyed(this))
      .subscribe((cartItems) => {
        this.items = cartItems;
        this.groupItems();
        this.cd.markForCheck();
      });
  }

  private subscribeToCurrentStep() {
    this.cartService.currentStep$.pipe(untilDestroyed(this)).subscribe((step) => {
      this.currentStep = step;
      this.setDefaultGroupVisibility();
      this.cd.markForCheck();
    });
  }

  private subscribeToCurrentTransaction() {
    const fetchedCurrentTransaction = this.cartService.getCurrentTransaction();

    if (fetchedCurrentTransaction === undefined) {
      return;
    }

    this.currentTransactionSubscription = this.cartService
      .getCurrentTransaction()
      .pipe(untilDestroyed(this))
      .subscribe((transaction) => {
        this.pendingTransaction = transaction;
        this.cd.markForCheck();
      });
  }

  public setDefaultGroupVisibility() {
    if (this.currentStep !== this.stepType.CONFIRM && this.selectedNetwork) {
      this.expandedGroups.add(this.selectedNetwork);
      this.expandedGroups.clear();
    } else {
      if (this.currentStep === this.stepType.CONFIRM && this.groupedCartItems.length === 1) {
        this.groupedCartItems.forEach((group) => {
          this.expandedGroups.add(group.tokenSymbol);
        });
      }
    }

    this.cd.markForCheck();
  }

  public toggleGroup(event: MouseEvent, groupSymbol: string): void {
    event.stopPropagation();
    if (this.expandedGroups.has(groupSymbol)) {
      this.expandedGroups.delete(groupSymbol);
    } else {
      this.expandedGroups.add(groupSymbol);
    }
    this.cd.markForCheck();
  }

  public isGroupExpanded(groupSymbol: string): boolean {
    return this.expandedGroups.has(groupSymbol);
  }

  public setNetworkSelection(networkSymbol: string): void {
    this.selectedNetwork = networkSymbol;
    localStorage.setItem('cartCheckoutSelectedNetwork', networkSymbol);
    this.expandedGroups.clear();
    this.expandedGroups.add(networkSymbol);
    this.cd.markForCheck();
  }

  public clearNetworkSelection(): void {
    localStorage.removeItem('cartCheckoutSelectedNetwork');
    this.selectedNetwork = null;
  }

  public groupItems() {
    const availabilityChecks$ = this.items.map((item) =>
      this.cartService.isCartItemAvailableForSale(item).pipe(
        map((result) => ({ item, isAvailable: result.isAvailable })),
        switchMap((result) => (result ? of(result) : of({ item, isAvailable: false }))),
      ),
    );

    forkJoin(availabilityChecks$).subscribe((results) => {
      const groups: { [tokenSymbol: string]: GroupedCartItem } = {};
      this.unavailableItemCount = 0;

      results.forEach(({ item, isAvailable }) => {
        if (!isAvailable) {
          this.unavailableItemCount++;
          return;
        }

        const tokenSymbol =
          (item.nft?.placeholderNft
            ? item.collection?.mintingData?.network
            : item.nft?.mintingData?.network) || DEFAULT_NETWORK;
        const discount = this.discount(item);
        const originalPrice = this.calcPrice(item, 1);
        const discountedPrice = this.calcPrice(item, discount);
        const price = discount < 1 ? discountedPrice : originalPrice;
        item.salePrice = price;

        const network =
          (item.nft?.placeholderNft
            ? item.collection?.mintingData?.network
            : item.nft?.mintingData?.network) || DEFAULT_NETWORK;

        if (!groups[tokenSymbol]) {
          groups[tokenSymbol] = {
            tokenSymbol,
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
            network,
          };
        }

        groups[tokenSymbol].items.push(item);
        groups[tokenSymbol].totalQuantity += item.quantity;
        groups[tokenSymbol].totalPrice += item.quantity * item.salePrice;
      });

      this.groupedCartItems = Object.values(groups);
      this.cd.markForCheck();
    });
  }

  public updateStep(step: StepType) {
    this.cartService.setCurrentStep(step);
  }

  private removePurchasedGroupItems(): void {
    if (this.selectedNetwork) {
      this.cartService.removeGroupItemsFromCart(this.selectedNetwork);
      this.clearNetworkSelection();
    }
  }

  private calcPrice(item: CartItem, discount: number): number {
    return this.cartService.calcPrice(item.nft, discount);
  }

  private discount(item: CartItem): number {
    return this.cartService.discount(item.collection, item.nft);
  }

  public isCartItemAvailableForSale(item: CartItem): Observable<boolean> {
    return this.cartService
      .isCartItemAvailableForSale(item)
      .pipe(map((result) => result.isAvailable));
  }

  public reset(): void {
    this.receivedTransactions = false;
    this.currentStep = StepType.CONFIRM;
    this.purchasedNfts = undefined;
    this.history = [];
    this.cd.markForCheck();
  }

  public handleClose(alsoCloseCartModal = false): void {
    this.cartService.closeCheckoutOverlay();
    if (alsoCloseCartModal) {
      this.cartService.hideCartModal();
    }
  }

  public goToNft(nftUid: string): void {
    if (!nftUid) {
      return;
    }

    this.router.navigate(['/', this.nftPath, nftUid]);
    this.handleClose(true);
  }

  public goToCollection(colUid: string): void {
    if (!colUid) {
      return;
    }

    this.router.navigate(['/', this.collectionPath, colUid]);
    this.handleClose(true);
  }

  public goToMemberNfts(): void {
    const memberId = this.auth.member$.value?.uid;

    if (!memberId) {
      return;
    }

    this.router.navigate(['/member', memberId, 'nfts']);
    this.handleClose(true);
  }

  public getRecords(): Nft[] | null | undefined {
    return this.purchasedNfts || null;
  }

  public pushToHistory(
    transaction: Transaction,
    uniqueId: string,
    date?: dayjs.Dayjs | Timestamp | null,
    text?: string,
    link?: string,
  ): void {
    if (
      this.history.find((s) => {
        return s.uniqueId === uniqueId;
      })
    ) {
      return;
    }

    if (date && text) {
      this.history.unshift({
        transaction,
        uniqueId: uniqueId,
        date: date,
        label: text,
        link: link,
      });
    }
  }

  public get lockTime(): number {
    return TRANSACTION_AUTO_EXPIRY_MS / 1000 / 60;
  }

  public async initiateBulkOrder(): Promise<void> {
    if (this.cartService.hasPendingTransaction()) {
      this.nzNotification.error(
        'You currently have an open order. Pay for it or let it expire.',
        '',
      );
      return;
    }

    const selectedGroup = this.groupedCartItems.find(
      (group) => group.tokenSymbol === this.selectedNetwork,
    );

    if (selectedGroup && selectedGroup.items.length > 0) {
      this.purchasedTokenSymbol = selectedGroup.tokenSymbol;
      const firstItem = selectedGroup.items[0];
      this.mintingDataNetwork = firstItem.nft?.placeholderNft
        ? firstItem.collection?.mintingData?.network
        : firstItem.nft?.mintingData?.network;
    }

    if (!selectedGroup || selectedGroup.items.length === 0) {
      this.nzNotification.error(
        $localize`No network selected or no items in the selected network.`,
        '',
      );
      return;
    }

    const nfts = this.convertGroupedCartItemsToNfts(selectedGroup);

    if (nfts.length === 0) {
      this.nzNotification.error($localize`No NFTs to purchase.`, '');
      return;
    }

    await this.proceedWithBulkOrder(nfts);
  }

  public convertGroupedCartItemsToNfts(selectedGroup: GroupedCartItem): NftPurchaseRequest[] {
    const nfts: NftPurchaseRequest[] = [];

    selectedGroup.items.forEach((item) => {
      if (item.nft && item.collection) {
        for (let i = 0; i < item.quantity; i++) {
          const nftData: NftPurchaseRequest = {
            collection: item.collection.uid,
          };

          if (item.nft.owner || item.collection.type === CollectionType.CLASSIC) {
            nftData.nft = item.nft.uid;
          }

          nfts.push(nftData);
        }
      }
    });

    return nfts;
  }

  public async proceedWithBulkOrder(nfts: NftPurchaseRequest[]): Promise<void> {
    const selectedGroup = this.groupedCartItems.find(
      (group) => group.tokenSymbol === this.selectedNetwork,
    );
    if (!selectedGroup) {
      this.nzNotification.error(
        $localize`No network selected or no items in the selected network.`,
        '',
      );
      return;
    }

    if (nfts.length === 0 || !this.agreeTermsConditions) {
      this.nzNotification.error(
        $localize`No NFTs to purchase or terms and conditions are not agreed.`,
        '',
      );
      return;
    }

    const bulkPurchaseRequest = {
      orders: nfts,
    };

    await this.auth.sign(bulkPurchaseRequest, async (signedRequest, finish) => {
      this.notification
        .processRequest(
          this.orderApi.orderNfts(signedRequest),
          $localize`Bulk order created.`,
          finish,
        )
        .subscribe((transaction: Transaction | undefined) => {
          if (transaction) {
            this.transSubscription$?.unsubscribe();
            setCheckoutTransaction({
              transactionId: transaction.uid,
              source: 'cartCheckout',
            });
            this.cartService.setCurrentTransaction(transaction.uid);
            this.cartService.setCurrentStep(StepType.TRANSACTION);
            this.cartService.refreshCartItems();
            this.cd.markForCheck();
            this.transSubscription$ = this.orderApi
              .listen(transaction.uid)
              .subscribe(<any>this.transaction$);
            this.pushToHistory(
              transaction,
              transaction.uid,
              dayjs(),
              $localize`Waiting for transaction...`,
            );
          } else {
            this.nzNotification.error(
              $localize`Transaction failed or did not return a valid transaction.`,
              '',
            );
          }
        });
    });
  }

  public getSelectedNetwork(): any {
    const selectedNetwork = localStorage.getItem('cartCheckoutSelectedNetwork') || '';
    return selectedNetwork;
  }

  ngOnDestroy() {
    this.currentTransactionSubscription?.unsubscribe();
  }
}
