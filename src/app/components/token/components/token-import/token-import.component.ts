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
import { Router } from '@angular/router';
import { OrderApi } from '@api/order.api';
import { TokenMintApi } from '@api/token_mint.api';
import { AuthService } from '@components/auth/services/auth.service';
import { TransactionStep } from '@components/transaction-steps/transaction-steps.component';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { StorageItem, removeItem, setItem } from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import {
  Network,
  Space,
  TRANSACTION_AUTO_EXPIRY_MS,
  Timestamp,
  Transaction,
  TransactionType,
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
  selector: 'wen-token-import',
  templateUrl: './token-import.component.html',
  styleUrls: ['./token-import.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenImportComponent implements OnInit {
  @Input() currentStep = StepType.SELECT;
  @Input() space: Space | undefined = undefined;

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }
  @Output() wenOnClose = new EventEmitter<void>();

  public stepType = StepType;
  public isCopied = false;
  public selectedNetwork?: Network;
  public agreeTermsConditions = false;
  public targetAddress?: string = 'dummy_address';
  public targetAmount?: number = 1200000;
  public tokenIdControl = new FormControl('');
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
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
    private router: Router,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
    private tokenMintApi: TokenMintApi,
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
          removeItem(StorageItem.TokenMintTransaction);
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
            removeItem(StorageItem.TokenMintTransaction);
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

  public goToToken(): void {
    this.router.navigate(['/', ROUTER_UTILS.config.token.root, this.tokenIdControl.value]);
    this.close();
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
      !this.tokenIdControl.value ||
      !this.space?.uid ||
      this.selectedNetwork === undefined ||
      !this.agreeTermsConditions
    ) {
      return;
    }

    const params: any = {
      tokenId: this.tokenIdControl.value,
      space: this.space.uid,
      network: this.selectedNetwork,
    };

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.tokenMintApi.importToken(sc), 'Order created.', finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          setItem(StorageItem.TokenMintTransaction, val.uid);
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
}
