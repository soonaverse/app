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
import { FormControl, Validators } from '@angular/forms';
import { OrderApi } from '@api/order.api';
import { StakeRewardApi } from '@api/stake_reward';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import {
  StorageItem,
  getItem,
  getTokenStakeItem,
  removeStakeTokenItem,
  setItem,
  setTokenStakeItem,
} from '@core/utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import {
  MAX_WEEKS_TO_STAKE,
  MIN_WEEKS_TO_STAKE,
  SOON_TOKEN,
  SOON_TOKEN_TEST,
  StakeReward,
  StakeType,
  TRANSACTION_AUTO_EXPIRY_MS,
  Timestamp,
  Token,
  TokenStats,
  Transaction,
  TransactionType,
  calcStakedMultiplier,
  getDefDecimalIfNotSet,
  tiers,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, Subscription, interval, merge } from 'rxjs';

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
  selector: 'wen-token-stake',
  templateUrl: './token-stake.component.html',
  styleUrls: ['./token-stake.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenStakeComponent implements OnInit, OnDestroy {
  @Input() currentStep = StepType.CONFIRM;
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
    if (
      value &&
      (this.auth.memberSoonDistribution$.value?.stakes?.[StakeType.DYNAMIC]?.value || 0) > 0
    ) {
      this.setCollapsed(false);
    }
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() staticStakeEnabled?: boolean;
  @Input() token?: Token;
  @Input() tokenStats?: TokenStats | null;
  @Input() rewards?: StakeReward[] | null;
  @Input() set amount(value: number | undefined) {
    if (value) {
      this.amountControl.setValue(value);
    }
  }
  @Input() set weeks(value: number) {
    this.weekControl.setValue(value);
  }
  @Output() wenOnClose = new EventEmitter<void>();

  public targetAddress?: string = '';
  public invalidPayment = false;
  public staticStake = false;
  public targetAmount?: number;
  public receivedTransactions = false;
  public weeksOptions = Array.from({ length: 52 }, (_, i) => i + 1);
  public purchasedAmount = 0;
  public amountControl: FormControl = new FormControl(null, [
    Validators.required,
    Validators.min(1),
  ]);
  public weekControl: FormControl = new FormControl(1, [
    Validators.required,
    Validators.min(MIN_WEEKS_TO_STAKE),
    Validators.max(MAX_WEEKS_TO_STAKE),
  ]);

  public stakeControl: FormControl = new FormControl({ value: 0, disabled: true });
  public multiplierControl: FormControl = new FormControl({ value: 0, disabled: true });
  public earnControl: FormControl = new FormControl({ value: 0, disabled: true });
  public levelControl: FormControl = new FormControl({ value: 0, disabled: true });
  public history: HistoryItem[] = [];
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public isCopied = false;
  private _isOpen = false;
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
    private tokenApi: TokenApi,
    private stakeRewardApi: StakeRewardApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    merge(this.amountControl.valueChanges, this.weekControl.valueChanges)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if ((this.amountControl.value || 0) > 0 && (this.weekControl.value || 0) > 0) {
          const val =
            calcStakedMultiplier(this.weekControl.value) * (this.amountControl.value || 0);
          this.stakeControl.setValue(val.toFixed(2));
          const newTotal =
            (this.auth.memberSoonDistribution$.value?.stakes?.[StakeType.DYNAMIC]?.value || 0) +
            Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals)) * val;
          let l = 0;
          tiers.forEach((a) => {
            if (newTotal >= a) {
              l++;
            }
          });

          if (l > tiers.length - 1) {
            l = tiers.length - 1;
          }

          this.levelControl.setValue(l);
          this.multiplierControl.setValue(calcStakedMultiplier(this.weekControl.value));
          if (this.tokenStats && this.rewards) {
            this.earnControl.setValue(
              this.stakeRewardApi.calcApy(
                this.tokenStats,
                this.stakeControl.value * Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals)),
                this.rewards,
              ),
            );
          }
          this.cd.markForCheck();
        } else {
          this.stakeControl.setValue(0);
          this.multiplierControl.setValue(0);
          this.earnControl.setValue(0);
        }
      });

    this.receivedTransactions = false;
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        this.targetAmount = val.payload.amount;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          this.token && removeStakeTokenItem(this.token.uid);
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

      this.amountControl.setValue(this.amountControl.value);
      this.cd.markForCheck();
    });

    if (this.token && getTokenStakeItem(this.token.uid)) {
      this.transSubscription = this.orderApi
        .listen(<string>getTokenStakeItem(this.token.uid))
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
            this.token && removeStakeTokenItem(this.token.uid);
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

  public isSoonToken(): boolean {
    return this.token?.uid === (environment.production ? SOON_TOKEN : SOON_TOKEN_TEST);
  }

  public reset(): void {
    this.isOpen = false;
    this.currentStep = StepType.CONFIRM;
    this.cd.markForCheck();
  }

  public isInfoCollapsed(): boolean {
    return getItem(StorageItem.StakingDetails) === false ? false : true;
  }

  public setCollapsed(event: any): void {
    setItem(StorageItem.StakingDetails, event);
  }

  public async stakeToken(): Promise<void> {
    if (!this.token) {
      return;
    }

    const params: any = {
      symbol: this.token.symbol,
      type: this.staticStake ? StakeType.STATIC : StakeType.DYNAMIC,
      weeks: this.weekControl.value,
    };

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.tokenApi.depositStake(sc), $localize`Token stake submitted.`, finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          this.token && setTokenStakeItem(this.token.uid, val.uid);
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
        });
    });
  }

  public get stepType(): typeof StepType {
    return StepType;
  }

  public ngOnDestroy(): void {
    this.transSubscription?.unsubscribe();
  }
}
