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
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { StorageItem, getItem, setItem } from '@core/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService as HelperServiceProposal } from '@pages/proposal/services/helper.service';
import { HelperService } from '@pages/token/services/helper.service';
import {
  Proposal,
  ProposalAnswer,
  SERVICE_MODULE_FEE_TOKEN_EXCHANGE,
  Space,
  TRANSACTION_AUTO_EXPIRY_MS,
  Timestamp,
  Token,
  Transaction,
  TransactionType,
  getDefDecimalIfNotSet,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, Subscription, interval } from 'rxjs';

export enum VoteType {
  NATIVE_TOKEN = 0,
  STAKED_TOKEN = 1,
}

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
  selector: 'wen-token-vote',
  templateUrl: './token-vote.component.html',
  styleUrls: ['./token-vote.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenVoteComponent implements OnInit, OnDestroy {
  @Input() set currentStep(value: StepType | undefined) {
    this._currentStep = value;
    if (this.currentStep === StepType.TRANSACTION && this.token?.uid) {
      const acceptedTerms = (getItem(StorageItem.TokenOffersAcceptedTerms) || []) as string[];
      setItem(StorageItem.TokenOffersAcceptedTerms, [
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
  @Input() proposal?: Proposal;
  @Input() space?: Space;
  @Input() totalStaked?: number | null;
  @Input() question?: string | null;
  @Input() answer?: ProposalAnswer | null;
  @Output() wenOnClose = new EventEmitter<void>();
  public amount = 0;
  public targetAddress?: string = '';
  public invalidPayment = false;
  public targetAmount?: number;
  public receivedTransactions = false;
  public purchasedAmount = 0;
  public now$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());
  public history: HistoryItem[] = [];
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public isCopied = false;
  public voteTypeControl: FormControl = new FormControl(VoteType.NATIVE_TOKEN, [
    Validators.required,
  ]);
  public amountControl: FormControl = new FormControl(null, [Validators.required]);
  public voteTypeOptions: {
    label: string;
    value: VoteType;
  }[] = [
    {
      label: $localize`Send Native Tokens`,
      value: VoteType.NATIVE_TOKEN,
    },
    {
      label: $localize`Use Staked Tokens`,
      value: VoteType.STAKED_TOKEN,
    },
  ];
  private _isOpen = false;
  private _currentStep?: StepType;
  private transSubscription?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public helperProposal: HelperServiceProposal,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    public auth: AuthService,
    private notification: NotificationService,
    private orderApi: OrderApi,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
  ) {
    setInterval(() => {
      this.now$.next(new Date());
    }, 1000);
  }

  public ngOnInit(): void {
    this.receivedTransactions = false;
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        this.targetAmount = val.payload.amount;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          // TODO remove empty if
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
          val.uid + '_vote_received',
          val.createdOn,
          $localize`Vote received.`,
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
            $localize`Transaction confirmed and funds refunded.`,
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
        val.payload.invalidPayment === true &&
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
        val.payload.invalidPayment === true &&
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
      this.currentStep = StepType.CONFIRM;
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

  public get voteTypes(): typeof VoteType {
    return VoteType;
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

  public async proceedWithVote(cb?: any): Promise<void> {
    if (!this.token || !this.proposal?.uid || !this.answer?.value) {
      return;
    }
    const params: any = {
      uid: this.proposal.uid,
      value: this.answer.value,
    };

    if (this.voteTypeControl.value === VoteType.NATIVE_TOKEN) {
      return this.proceedWithNativeVote(params, cb);
    } else {
      params.voteWithStakedTokes = true;
      return this.proceedWithStakedTokens(params, cb);
    }
  }

  private async proceedWithStakedTokens(params: any, cb?: any): Promise<void> {
    const r = await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.tokenApi.voteOnProposal(sc), $localize`Token vote executed.`, finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          this.close();
        });
    });

    if (!r) {
      this.close();
    }
  }

  private async proceedWithNativeVote(params: any, cb?: any): Promise<void> {
    const r = await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(
          this.tokenApi.voteOnProposal(sc),
          $localize`Token vote order created.`,
          finish,
        )
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
          if (cb) {
            cb();
          }
        });
    });

    if (!r) {
      this.close();
    }
  }

  public getWeight(): number {
    let amount;
    if (this.voteTypeControl.value === VoteType.NATIVE_TOKEN) {
      amount = this.amountControl.value * Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals));
    } else {
      amount = this.totalStaked || 0;
    }

    if (this.helperProposal.isCommencing(this.proposal)) {
      return amount;
    } else {
      // Already started so it'll be propotional.
      const totalTime = dayjs(this.proposal?.settings?.endDate.toDate()).diff(
        dayjs(this.proposal?.settings?.startDate.toDate()),
      );
      const diffFromNow = dayjs(this.proposal?.settings?.endDate.toDate()).diff(dayjs());

      const pct = Math.round((diffFromNow / totalTime) * 100) / 100;
      return amount * pct;
    }
  }

  public get stepType(): typeof StepType {
    return StepType;
  }

  public getTargetAmount(): number {
    return this.amount * Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals));
  }

  public get exchangeFee(): number {
    return SERVICE_MODULE_FEE_TOKEN_EXCHANGE;
  }

  public ngOnDestroy(): void {
    this.transSubscription?.unsubscribe();
  }
}
