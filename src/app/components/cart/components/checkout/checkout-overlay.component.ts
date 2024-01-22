import { Component, Input, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Output, EventEmitter, } from '@angular/core';
import { CartItem, CartService } from './../../services/cart.service';
import {
  CollectionType,
  Nft,
  Timestamp,
  Transaction,
  TransactionType,
  TRANSACTION_AUTO_EXPIRY_MS,
  NftPurchaseRequest,
  Network,
} from '@build-5/interfaces';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { OrderApi } from '@api/order.api';
import { NftApi } from '@api/nft.api';
//import { FileApi } from '@api/file.api';
import { BehaviorSubject, firstValueFrom, interval, Subscription, take } from 'rxjs';
import { TransactionService } from '@core/services/transaction';
import { getItem, removeItem, setItem, StorageItem } from '@core/utils';
import dayjs from 'dayjs';
import { HelperService } from '@pages/nft/services/helper.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';

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
  selector: 'app-checkout-overlay',
  templateUrl: './checkout-overlay.component.html',
  styleUrls: ['./checkout-overlay.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutOverlayComponent implements OnInit {
  @Input() currentStep = StepType.CONFIRM;
  @Input() items: CartItem[] = [];
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
    //this.checkoutService.modalOpen$.next(value);
  }
  @Output() wenOnClose = new EventEmitter<void>();
  groupedCartItems: GroupedCartItem[] = [];
  unavailableItemCount = 0;
  cartItemPrices: { [key: string]: { originalPrice: number, discountedPrice: number } } = {};
  public agreeTermsConditions = false;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<Transaction | undefined>(undefined);
  public history: HistoryItem[] = [];
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> = new BehaviorSubject<dayjs.Dayjs | null>(null);
  public invalidPayment = false;
  public receivedTransactions = false;
  public targetAddress?: string;
  public targetAmount?: number;
  public purchasedNfts?: Nft[] | null;
  private _isOpen = false;
  public stepType = StepType;
  public selectedNetwork: string | null = null;
  public mintingDataNetwork: Network | undefined;

  private transSubscription?: Subscription;
  public nftPath = ROUTER_UTILS.config.nft.root;

  constructor(
    private cartService: CartService,
    private auth: AuthService,
    private notification: NotificationService,
    private orderApi: OrderApi,
    public transactionService: TransactionService,
    public helper: HelperService,
    private cd: ChangeDetectorRef,
    private nftApi: NftApi,
    //private fileApi: FileApi,
    private router: Router,
    private nzNotification: NzNotificationService,
  ) {}

  ngOnInit() {
    console.log('checkout-overlay ngOnInit called, running groupItems code.');
    this.groupItems();
    this.receivedTransactions = false;
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      console.log('transaction val: ', val);
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        this.targetAmount = val.payload.amount;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          // It's expired.
          removeItem(StorageItem.CheckoutTransaction);
        }
        if (val.linkedTransactions && val.linkedTransactions?.length > 0) {
          this.currentStep = StepType.WAIT;
          // Listen to other transactions.
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
      }

      if (
        val &&
        val.type === TransactionType.PAYMENT &&
        val.payload.reconciled === true &&
        (<any>val).payload.invalidPayment === false
      ) {
        // Let's add delay to achive nice effect.
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

          const purchasedItemIds = this.getPurchasedItemIds(val);
          this.cartService.removeItemsFromCart(purchasedItemIds);



          this.cd.markForCheck();
        }, 2000);

        // Load purchased NFTs.
        if (val.payload.nftOrders && val.payload.nftOrders.length > 0) {
          this.purchasedNfts = this.purchasedNfts || [];
          val.payload.nftOrders.forEach(nftOrder => {
            firstValueFrom(this.nftApi.listen(nftOrder.nft)).then((obj) => {
              if (obj !== null && obj !== undefined) {
                const purchasedNft = obj as Nft; // Type assertion

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

        // Let's go back to wait. With slight delay so they can see this.
        markInvalid();
      }

      this.cd.markForCheck();
    });

    if (getItem(StorageItem.CheckoutTransaction)) {
      this.transSubscription = this.orderApi
        .listen(<string>getItem(StorageItem.CheckoutTransaction))
        .subscribe(<any>this.transaction$);
    }

    // Run ticker.
    const int: Subscription = interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.expiryTicker$.next(this.expiryTicker$.value);

        // If it's in the past.
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
  }

  groupItems() {
    console.log('groupItems function called.')
    const groups: { [tokenSymbol: string]: GroupedCartItem } = {};
    this.items.forEach(item => {
      const tokenSymbol = (item.nft?.placeholderNft ? item.collection?.mintingData?.network : item.nft?.mintingData?.network) || 'Unknown';
      const discount = this.discount(item);
      const originalPrice = this.calcPrice(item, 1);
      const discountedPrice = this.calcPrice(item, discount);
      const price = (this.discount(item) < 1) ? discountedPrice : originalPrice;
      item.salePrice = price;

      if (this.cartService.isCartItemAvailableForSale(item)) {
        if (!groups[tokenSymbol]) {
          groups[tokenSymbol] = { tokenSymbol, items: [], totalQuantity: 0, totalPrice: 0 };
        }
        groups[tokenSymbol].items.push(item);
        groups[tokenSymbol].totalQuantity += item.quantity;
        groups[tokenSymbol].totalPrice += item.quantity * item.salePrice;
      } else {
        this.unavailableItemCount++;
      }

      console.log('Cart item loop finished, group: ', groups[tokenSymbol])
    });

    this.groupedCartItems = Object.values(groups);
  }

  private calcPrice(item: CartItem, discount: number): number {
    return this.cartService.calcPrice(item, discount);
  }

  private discount(item: CartItem): number {
    return this.cartService.discount(item.collection, item.nft);
  }

  public isCartItemAvailableForSale(item: CartItem): any {
    return this.cartService.isCartItemAvailableForSale(item);
  }

  public reset(): void {
    this.receivedTransactions = false;
    this.isOpen = false;
    this.currentStep = StepType.CONFIRM;
    this.purchasedNfts = undefined;
    this.cd.markForCheck();
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public getRecords(): Nft[] | null | undefined {
    return this.purchasedNfts || null;
  }

  private getPurchasedItemIds(transaction: Transaction): string[] {
    return transaction.payload.nftOrders?.map(item => item.nft) || [];
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
    const selectedGroup = this.groupedCartItems.find(group => group.tokenSymbol === this.selectedNetwork);

    if (selectedGroup && selectedGroup.items.length > 0) {
      const firstItem = selectedGroup.items[0];
      this.mintingDataNetwork = firstItem.nft?.placeholderNft ? firstItem.collection?.mintingData?.network : firstItem.nft?.mintingData?.network;
    }

    if (!selectedGroup || selectedGroup.items.length === 0) {
      console.warn('No network selected or no items in the selected network.');
      this.nzNotification.error($localize`No network selected or no items in the selected network.`, '');
      return;
    }

    // Convert only the NFTs from the selected group
    const nfts = this.convertGroupedCartItemsToNfts(selectedGroup);

    if (nfts.length === 0) {
      console.warn('No NFTs to purchase.');
      this.nzNotification.error($localize`No NFTs to purchase.`, '');
      return;
    }

    await this.proceedWithBulkOrder(nfts);
  }


  convertGroupedCartItemsToNfts(selectedGroup: GroupedCartItem): NftPurchaseRequest[] {
    const nfts: NftPurchaseRequest[] = [];

    selectedGroup.items.forEach(item => {
      if (item.nft && item.collection) {
        const nftData: NftPurchaseRequest = {
          collection: item.collection.uid,
        };

        if (item.collection.type === CollectionType.CLASSIC) {
          nftData.nft = item.nft.uid;
        }

        // If owner is set, CollectionType is not relevant.
        if (item.nft.owner) {
          nftData.nft = item.nft.uid;
        }

        nfts.push(nftData);
      }
    });

    return nfts;
  }

  public async proceedWithBulkOrder(nfts: NftPurchaseRequest[]): Promise<void> {
    const selectedGroup = this.groupedCartItems.find(group => group.tokenSymbol === this.selectedNetwork);
    if (!selectedGroup) {
      console.warn('No network selected or no items in the selected network.');
      this.nzNotification.error($localize`No network selected or no items in the selected network.`, '');
      return;
    }

    if (nfts.length === 0 || !this.agreeTermsConditions) {
      console.warn('No NFTs to purchase or terms and conditions are not agreed.');
      this.nzNotification.error($localize`No NFTs to purchase or terms and conditions are not agreed.`, '');
      return;
    }

    const bulkPurchaseRequest = {
      orders: nfts
    };

    await this.auth.sign(bulkPurchaseRequest, async (signedRequest, finish) => {
      this.notification
        .processRequest(this.orderApi.orderNfts(signedRequest), $localize`Bulk order created.`, finish)
        .subscribe((transaction: Transaction | undefined) => {
          if (transaction) {
            this.transSubscription?.unsubscribe();
            setItem(StorageItem.CheckoutTransaction, transaction.uid);
            this.transSubscription = this.orderApi.listen(transaction.uid).subscribe(<any>this.transaction$);
            this.pushToHistory(transaction, transaction.uid, dayjs(), $localize`Waiting for transaction...`);
          } else {
            console.error('Transaction failed or did not return a valid transaction.');
            this.nzNotification.error($localize`Transaction failed or did not return a valid transaction.`, '');
          }
        });
    });
  }

}
