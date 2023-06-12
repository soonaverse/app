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
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { TransactionStep } from '@components/transaction-steps/transaction-steps.component';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { getVerifyAddressItem, removeVerifyAddressItem, setVerifyAddressItem } from '@core/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  DEFAULT_NETWORK,
  Member,
  Network,
  Space,
  Timestamp,
  Transaction,
  TransactionType,
  TRANSACTION_AUTO_EXPIRY_MS,
} from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { EntityType } from './../wallet-address.component';

export enum StepType {
  GENERATE = 'Generate',
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
  selector: 'wen-verify-address',
  templateUrl: './verify-address.component.html',
  styleUrls: ['./verify-address.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyAddressComponent implements OnInit, OnDestroy {
  @Input() currentStep = StepType.GENERATE;
  @Input() network: Network | null = DEFAULT_NETWORK;
  @Input() entityType?: EntityType;
  @Input() entity?: Space | Member | null;
  @Output() wenOnClose = new EventEmitter<void>();

  public stepType = StepType;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public receivedTransactions = false;
  public history: HistoryItem[] = [];
  public invalidPayment = false;
  public targetAddress?: string;
  public targetAmount?: number;
  public networks = Network;
  public steps: TransactionStep[] = [
    { label: $localize`Generate address`, sequenceNum: 0 },
    { label: $localize`Make transaction`, sequenceNum: 1 },
    { label: $localize`Wait for confirmation`, sequenceNum: 2 },
    { label: $localize`Confirmed`, sequenceNum: 3 },
  ];

  private transSubscription?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private auth: AuthService,
    private notification: NotificationService,
    private cd: ChangeDetectorRef,
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
          getVerifyAddressItem(this.network || DEFAULT_NETWORK);
        }

        if (val.linkedTransactions?.length > 0) {
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
          'Payment received.',
          (<any>val).payload?.chainReference,
        );
        this.receivedTransactions = true;
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
        val.payload.invalidPayment === true &&
        val.ignoreWallet === false &&
        !val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(
          val,
          val.uid + '_credit_back',
          dayjs(),
          $localize`Invalid amount received. Refunding transaction...`,
        );
      }

      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.payload.invalidPayment === true &&
        val.ignoreWallet === true &&
        !val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(
          val,
          val.uid + '_credit_back',
          dayjs(),
          $localize`Invalid transaction.You must gift storage deposit.`,
        );

        markInvalid();
      }

      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.payload.invalidPayment === false &&
        !val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(
          val,
          val.uid + '_credit_back',
          dayjs(),
          $localize`Refunding your payment...`,
        );
      }

      // Credit
      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(val, val.uid + '_refund_complete', dayjs(), 'Payment refunded.');

        if (val.payload.invalidPayment) {
          markInvalid();
        }
      }

      if (
        val &&
        val.type === TransactionType.CREDIT &&
        val.payload.reconciled === true &&
        val.payload.invalidPayment === false &&
        val.payload?.walletReference?.chainReference
      ) {
        this.pushToHistory(val, val.uid + '_confirmed_address', dayjs(), 'Address confirmed.');
        removeVerifyAddressItem(this.network || DEFAULT_NETWORK);
        this.currentStep = StepType.CONFIRMED;
      }

      this.cd.markForCheck();
    });

    if (getVerifyAddressItem(this.network || DEFAULT_NETWORK)) {
      this.transSubscription = this.orderApi
        .listen(<string>getVerifyAddressItem(this.network || DEFAULT_NETWORK))
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
            removeVerifyAddressItem(this.network || DEFAULT_NETWORK);
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

  public reset(): void {
    this.receivedTransactions = false;
    this.currentStep = StepType.GENERATE;
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public isSpaceVerification(): boolean {
    return this.entityType === EntityType.SPACE;
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

  public async initVerification(): Promise<void> {
    if (!this.entity) {
      return;
    }

    const params: any = {
      network: this.network,
    };

    if (this.entityType === EntityType.SPACE) {
      params.space = this.entity.uid;
    }

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.orderApi.validateAddress(sc), 'Validation requested.', finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          setVerifyAddressItem(this.network || DEFAULT_NETWORK, val.uid);
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), 'Waiting for transaction...');
        });
    });
  }

  public address(network?: Network): string | undefined {
    return (this.entity?.validatedAddress || {})[network || DEFAULT_NETWORK] || '';
  }

  public networkName(network: Network | null): string | undefined {
    return Object.entries(this.networks).find(([_key, value]) => value === network)?.[0];
  }

  public getCurrentSequenceNum(): number {
    switch (this.currentStep) {
      case StepType.GENERATE:
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

  public ngOnDestroy(): void {
    this.transSubscription?.unsubscribe();
  }
}
