import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { CollectionApi } from '@api/collection.api';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { TransactionStep } from '@components/transaction-steps/transaction-steps.component';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { StorageItem, removeItem, setItem } from '@core/utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/collection/services/helper.service';
import {
  Collection,
  CollectionType,
  NETWORK_DETAIL,
  Network,
  TRANSACTION_AUTO_EXPIRY_MS,
  Timestamp,
  Transaction,
  TransactionType,
  UnsoldMintingOptions,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, Subscription, interval } from 'rxjs';

export enum StepType {
  SELECT = 'Select',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  CONFIRMED = 'Confirmed',
}

interface HistoryItem {
  uniqueId: string;
  date: dayjs.Dayjs | Timestamp | null;
  label: string;
  transaction: Transaction;
  link?: string;
}

@UntilDestroy()
@Component({
  selector: 'wen-collection-mint-network',
  templateUrl: './collection-mint-network.component.html',
  styleUrls: ['./collection-mint-network.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionMintNetworkComponent implements OnInit {
  @Input() currentStep = StepType.SELECT;

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() collection?: Collection;
  @Output() wenOnClose = new EventEmitter<void>();

  public stepType = StepType;
  public isCopied = false;
  public selectedNetwork?: Network;
  public unsoldControl = new FormControl(UnsoldMintingOptions.KEEP_PRICE);
  public newPrice = new FormControl('');
  public cancelActiveSales = false;
  public agreeTermsConditions = false;
  public targetAddress?: string = 'dummy_address';
  public targetAmount?: number = 1200000;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public environment = environment;
  public invalidPayment = false;
  public history: HistoryItem[] = [];
  public receivedTransactions = false;
  public steps: TransactionStep[] = [
    { label: $localize`Select network`, sequenceNum: 0 },
    { label: $localize`Make transaction`, sequenceNum: 1 },
    { label: $localize`Wait for confirmation`, sequenceNum: 2 },
    { label: $localize`Confirmed`, sequenceNum: 3 },
  ];
  private transSubscription?: Subscription;
  private _isOpen = false;

  constructor(
    public previewImageService: PreviewImageService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    public helper: HelperService,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
    private collectionApi: CollectionApi,
    private orderApi: OrderApi,
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
          removeItem(StorageItem.CollectionMintTransaction);
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
          this.currentStep = StepType.CONFIRMED;
          this.cd.markForCheck();
        }, 2000);
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
            removeItem(StorageItem.CollectionMintTransaction);
            int.unsubscribe();
            this.reset();
          }
        }
      });
  }

  public get lockTime(): number {
    return TRANSACTION_AUTO_EXPIRY_MS / 1000 / 60;
  }

  public reset(): void {
    this.isOpen = false;
    this.currentStep = StepType.SELECT;
    this.cd.markForCheck();
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public isExpired(val?: Transaction | null): boolean {
    if (!val?.createdOn) {
      return false;
    }

    const expiresOn: dayjs.Dayjs = dayjs(val.createdOn.toDate()).add(
      TRANSACTION_AUTO_EXPIRY_MS,
      'ms',
    );
    return expiresOn.isBefore(dayjs()) && val.type === TransactionType.ORDER;
  }

  public async proceedWithMint(): Promise<void> {
    if (
      !this.collection ||
      this.selectedNetwork === undefined ||
      !this.agreeTermsConditions ||
      !this.cancelActiveSales
    ) {
      return;
    }

    // TODO: add parameters
    const params: any = {
      collection: this.collection.uid,
      unsoldMintingOptions: this.unsoldControl.value,
      network: this.selectedNetwork,
    };

    if (this.unsoldControl.value === UnsoldMintingOptions.SET_NEW_PRICE) {
      params.price = Number(this.newPrice.value) * NETWORK_DETAIL[this.selectedNetwork].divideBy;
    }

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.collectionApi.mintCollection(sc), 'Order created.', finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          setItem(StorageItem.CollectionMintTransaction, val.uid);
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
        });
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

  public getCurrentSequenceNum(): number {
    switch (this.currentStep) {
      case StepType.SELECT:
        return 0;
      case StepType.TRANSACTION:
        return 1;
      case StepType.WAIT:
        return 2;
      case StepType.CONFIRMED:
        return 3;
      default:
        return 0;
    }
  }

  public get collectionTypes(): typeof CollectionType {
    return CollectionType;
  }

  public get unsoldNftOptions(): typeof UnsoldMintingOptions {
    return UnsoldMintingOptions;
  }
}
