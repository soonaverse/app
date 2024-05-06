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
import { TokenMarketApi } from '@api/token_market.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { StorageItem, getItem, setItem } from '@core/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import {
  DEFAULT_NETWORK,
  DEFAULT_NETWORK_DECIMALS,
  NETWORK_DETAIL,
  Network,
  Space,
  TRANSACTION_AUTO_EXPIRY_MS,
  Timestamp,
  Token,
  TokenTradeOrderType,
  Transaction,
  TransactionType,
  getDefDecimalIfNotSet,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import bigDecimal from 'js-big-decimal';
import { BehaviorSubject, Subscription, interval } from 'rxjs';

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  COMPLETE = 'Complete',
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
  selector: 'wen-token-bid',
  templateUrl: './token-bid.component.html',
  styleUrls: ['./token-bid.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenBidComponent implements OnInit, OnDestroy {
  @Input() set currentStep(value: StepType | undefined) {
    this._currentStep = value;
    if (this.currentStep === StepType.TRANSACTION && this.token?.uid) {
      const acceptedTerms = (getItem(StorageItem.TokenBidsAcceptedTerms) || []) as string[];
      setItem(StorageItem.TokenBidsAcceptedTerms, [
        ...acceptedTerms.filter((r) => r !== this.token?.uid),
        this.token.uid,
      ]);
    }
    this.cd.markForCheck();
  }

  get currentStep(): StepType | undefined {
    return this._currentStep;
  }

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() token?: Token;
  @Input() space?: Space;
  @Input() price = 0;
  @Input() amount = 0;
  @Output() wenOnClose = new EventEmitter<void>();

  public agreeTermsConditions = false;
  public agreeTokenTermsConditions = false;
  public targetAddress?: string = '';
  public invalidPayment = false;
  public targetAmount?: number;
  public receivedTransactions = false;
  public purchasedAmount = 0;
  public history: HistoryItem[] = [];
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public isCopied = false;
  private _isOpen = false;
  private _currentStep?: StepType;
  private transSubscription?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private auth: AuthService,
    private notification: NotificationService,
    private orderApi: OrderApi,
    private tokenMarketApi: TokenMarketApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.receivedTransactions = false;
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          // none.
        }
        if (val.linkedTransactions && val.linkedTransactions?.length > 0) {
          this.currentStep = StepType.TRANSACTION;
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
            val.createdOn,
            $localize`Confirming transaction.`,
          );
        }, 1000);

        setTimeout(() => {
          this.pushToHistory(
            val,
            val.uid + '_confirmed_trans',
            val.createdOn,
            $localize`Transaction confirmed.`,
          );
          this.purchasedAmount = val.payload.amount || 0;
          this.receivedTransactions = true;
          this.currentStep = StepType.COMPLETE;
          this.cd.markForCheck();
        }, 2000);
      }

      // Let's go back to wait. With slight delay so they can see this.
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
        val.payload?.walletReference?.chainReference &&
        !val.ignoreWalletReason
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

    if (this.token?.uid) {
      const acceptedTerms = getItem(StorageItem.TokenBidsAcceptedTerms) as string[];
      if (acceptedTerms && acceptedTerms.indexOf(this.token.uid) > -1) {
        this.currentStep = StepType.TRANSACTION;
        this.isOpen = false;
        this.cd.markForCheck();

        this.agreeTermsConditions = true;
        this.agreeTokenTermsConditions = true;
        // Hide while we're waiting.
        this.proceedWithBid((s: boolean) => {
          if (s) {
            this.isOpen = true;
            this.cd.markForCheck();
          } else {
            this.close();
          }
        }).catch(() => {
          this.close();
        });
      } else {
        this.currentStep = StepType.CONFIRM;
      }
      this.cd.markForCheck();
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
            int.unsubscribe();
            this.reset();
          }
        }
      });
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
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
    this.isOpen = false;
    this.currentStep = StepType.CONFIRM;
    this.cd.markForCheck();
  }

  public async proceedWithBid(cb?: any): Promise<void> {
    if (!this.token || !this.agreeTermsConditions || !this.agreeTokenTermsConditions) {
      return;
    }

    const params: any = {
      symbol: this.token.symbol,
      count: Number(this.amount * Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals))),
      price: Number(this.price),
      type: TokenTradeOrderType.BUY,
    };

    const r = await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(
          this.tokenMarketApi.tradeToken(sc),
          $localize`Bid created.`,
          (success: boolean) => {
            cb && cb(success);
            finish();
          },
        )
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
          if (cb) {
            cb && cb(true);
            finish();
          }
        });
    });

    if (!r) {
      this.close();
    }
  }

  public get stepType(): typeof StepType {
    return StepType;
  }

  public getDefaultNetworkDecimals(): number {
    return DEFAULT_NETWORK_DECIMALS;
  }

  public getTargetAmount(divideBy = false): number {
    return Number(
      bigDecimal[divideBy ? 'divide' : 'multiply'](
        bigDecimal.multiply(Number(this.amount), Number(this.price)),
        Math.pow(
          10,
          getDefDecimalIfNotSet(
            NETWORK_DETAIL[this.token?.mintingData?.network || DEFAULT_NETWORK].decimals,
          ),
        ),
        6,
      ),
    );
  }

  public getSymbolForNetwork(): Network {
    return <Network>this.token?.symbol.toLowerCase();
  }

  public ngOnDestroy(): void {
    this.transSubscription?.unsubscribe();
  }
}
