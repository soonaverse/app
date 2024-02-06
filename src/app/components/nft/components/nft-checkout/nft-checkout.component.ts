import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { FileApi } from '@api/file.api';
import { NftApi } from '@api/nft.api';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { CheckoutService } from '@core/services/checkout';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import {
  getItem,
  removeItem,
  setItem,
  StorageItem,
  setCheckoutTransaction,
  getCheckoutTransaction,
} from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/nft/services/helper.service';
import {
  Collection,
  CollectionType,
  MIN_AMOUNT_TO_TRANSFER,
  Nft,
  Space,
  Timestamp,
  Transaction,
  TransactionType,
  TRANSACTION_AUTO_EXPIRY_MS,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, firstValueFrom, interval, Subscription, take } from 'rxjs';

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  COMPLETE = 'Complete',
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
  selector: 'wen-nft-checkout',
  templateUrl: './nft-checkout.component.html',
  styleUrls: ['./nft-checkout.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftCheckoutComponent implements OnInit, OnDestroy {
  @Input() currentStep = StepType.CONFIRM;

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
    this.checkoutService.modalOpen$.next(value);
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input()
  set nft(value: Nft | null | undefined) {
    this._nft = value;
    if (this._nft) {
      this.fileApi
        .getMetadata(this._nft.media)
        .pipe(take(1), untilDestroyed(this))
        .subscribe((o) => {
          this.mediaType = o;
          this.cd.markForCheck();
        });

      if (this.currentStep === StepType.CONFIRM) {
        this.targetPrice = this._nft.availablePrice || this._nft.price || 0;
      }
    }
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Input()
  set collection(value: Collection | null | undefined) {
    this._collection = value;
    if (this.collection) {
      this.cache
        .getSpace(this.collection.royaltiesSpace)
        .pipe(untilDestroyed(this))
        .subscribe((space?: Space) => {
          this.royaltySpace = space;
          this.cd.markForCheck();
        });
    }
  }

  get collection(): Collection | null | undefined {
    return this._collection;
  }

  @Input() nftQuantity = 1;

  @Output() wenOnClose = new EventEmitter<void>();

  public purchasedNft?: Nft | null;
  public stepType = StepType;
  public isCopied = false;
  public agreeTermsConditions = false;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public receivedTransactions = false;
  public mediaType: 'video' | 'image' | undefined;
  public history: HistoryItem[] = [];
  public invalidPayment = false;
  public targetAddress?: string;
  public targetAmount?: number;
  public targetPrice = 0;
  public royaltySpace?: Space | null;
  private _isOpen = false;
  private _nft?: Nft | null;
  private _collection?: Collection | null;

  private transSubscription$?: Subscription;
  public path = ROUTER_UTILS.config.nft.root;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private checkoutService: CheckoutService,
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService,
    private cd: ChangeDetectorRef,
    private orderApi: OrderApi,
    private nftApi: NftApi,
    private fileApi: FileApi,
    private cache: CacheService,
  ) {}

  public ngOnInit(): void {
    this.receivedTransactions = false;
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        this.targetAmount = val.payload.amount;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          // It's expired.
          console.log(
            'nft-checkout ngOnInit - transaction expired, has a void payload or transaction is reconciled, removing CheckoutTransaction, transaction: ',
            val,
          );
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
          this.cd.markForCheck();
        }, 2000);

        // Load purchased NFT.
        if (val.payload.nft) {
          firstValueFrom(this.nftApi.listen(val.payload.nft)).then((obj) => {
            if (obj) {
              this.purchasedNft = <Nft>obj;
              this.fileApi
                .getMetadata(this.purchasedNft?.media)
                .pipe(take(1), untilDestroyed(this))
                .subscribe((o) => {
                  this.mediaType = o;
                  this.cd.markForCheck();
                });
              this.cd.markForCheck();
            }
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

    const checkoutTransaction = getCheckoutTransaction();
    if (checkoutTransaction && checkoutTransaction.transactionId) {
      this.transSubscription$ = this.orderApi
        .listen(checkoutTransaction.transactionId)
        .subscribe(this.transaction$);
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
            console.log(
              'nft-checkout ngOnInit - expiresOn.isBefore(dayjs()) passed, remove CheckoutTransaction, expiresOn: ',
              expiresOn,
            );
            removeItem(StorageItem.CheckoutTransaction);
            int.unsubscribe();
            this.reset();
          }
        }
      });
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

  public discount(): number {
    if (!this.collection?.space || !this.auth.member$.value || this.nft?.owner) {
      return 1;
    }

    const spaceRewards = (this.auth.member$.value.spaces || {})[this.collection.space];
    const descDiscounts = [...(this.collection.discounts || [])].sort(
      (a, b) => b.amount - a.amount,
    );
    for (const discount of descDiscounts) {
      const awardStat = (spaceRewards?.awardStat || {})[discount.tokenUid!];
      const memberTotalReward = awardStat?.totalReward || 0;
      if (memberTotalReward >= discount.tokenReward) {
        return 1 - discount.amount;
      }
    }
    return 1;
  }

  public calc(amount: number, discount: number): number {
    let finalPrice = Math.ceil(amount * discount);
    if (finalPrice < MIN_AMOUNT_TO_TRANSFER) {
      finalPrice = MIN_AMOUNT_TO_TRANSFER;
    }

    finalPrice = Math.floor(finalPrice / 1000 / 10) * 1000 * 10; // Max two decimals on Mi.
    return finalPrice;
  }

  public reset(): void {
    this.receivedTransactions = false;
    this.isOpen = false;
    this.currentStep = StepType.CONFIRM;
    this.purchasedNft = undefined;
    this.cd.markForCheck();
  }

  public goToNft(): void {
    this.router.navigate(['/', this.path, this.purchasedNft?.uid]);
    this.reset();
    this.wenOnClose.next();
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public getRecord(): Nft | null | undefined {
    return this.purchasedNft || this.nft;
  }

  public async proceedWithOrder(): Promise<void> {
    if (!this.collection || !this.nft || !this.agreeTermsConditions) {
      return;
    }

    const params: any = {
      collection: this.collection.uid,
    };

    if (this.collection.type === CollectionType.CLASSIC) {
      params.nft = this.nft.uid;
    }

    if (this.nft.owner) {
      params.nft = this.nft.uid;
    }

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.orderApi.orderNft(sc), $localize`Order created.`, finish)
        .subscribe((val: any) => {
          this.transSubscription$?.unsubscribe();
          setCheckoutTransaction({
            transactionId: val.uid,
            source: 'nftCheckout',
          });
          this.transSubscription$ = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
        });
    });
  }

  public getTitle(): any {
    if (!this.nft) {
      return '';
    }

    if (!this.purchasedNft) {
      if (this.nft.owner) {
        return this.nft.name;
      } else {
        if (this.nft.type === CollectionType.CLASSIC) {
          return this.nft.name;
        } else if (this.nft.type === CollectionType.GENERATED) {
          return $localize`Generated NFT`;
        } else if (this.nft.type === CollectionType.SFT) {
          return $localize`SFT`;
        }
      }
    } else {
      return this.purchasedNft.name;
    }
  }

  public ngOnDestroy(): void {
    this.transSubscription$?.unsubscribe();
  }
}
