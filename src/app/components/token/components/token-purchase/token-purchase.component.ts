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
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DescriptionItemType } from '@components/description/description.component';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  DEFAULT_NETWORK,
  NETWORK_DETAIL,
  Network,
  Space,
  Timestamp,
  Token,
  Transaction,
  TransactionType,
  getDefDecimalIfNotSet,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, Subscription, filter } from 'rxjs';

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
  transaction: Transaction;
  link?: string;
}

@UntilDestroy()
@Component({
  selector: 'wen-token-purchase',
  templateUrl: './token-purchase.component.html',
  styleUrls: ['./token-purchase.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenPurchaseComponent implements OnInit, OnDestroy {
  @Input() currentStep = StepType.CONFIRM;

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() token?: Token;
  @Input() space?: Space;
  @Output() wenOnClose = new EventEmitter<void>();

  public amountControl: FormControl = new FormControl(null);
  public iotaControl: FormControl = new FormControl(null);
  public isAmountInput = true;
  public agreeTermsConditions = false;
  public agreeTokenTermsConditions = false;
  public targetAddress?: string = '';
  public invalidPayment = false;
  public receivedTransactions = false;
  public purchasedAmount = 0;
  public history: HistoryItem[] = [];
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public isCopied = false;
  private _isOpen = false;
  private transSubscription?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private auth: AuthService,
    private notification: NotificationService,
    private orderApi: OrderApi,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.receivedTransactions = false;
    const startFrom = dayjs();
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      const historical = dayjs(val?.createdOn?.toDate()).isBefore(startFrom);

      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn!.toDate());
        if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
          // Nothing...
        }
        if (val.linkedTransactions && val.linkedTransactions?.length > 0) {
          this.currentStep = historical ? StepType.TRANSACTION : StepType.WAIT;
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
          if (!historical) {
            this.purchasedAmount = val.payload.amount || 0;
            this.receivedTransactions = true;
            this.currentStep = StepType.COMPLETE;
          }
          this.cd.markForCheck();
        }, 2000);
      }

      const markInvalid = () => {
        setTimeout(() => {
          if (!historical) {
            this.currentStep = StepType.TRANSACTION;
            this.invalidPayment = true;
          }
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
        val.payload.invalidPayment === true &&
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

    this.amountControl.valueChanges
      .pipe(
        filter(() => this.isAmountInput),
        untilDestroyed(this),
      )
      .subscribe((val: string) => {
        this.iotaControl.setValue((Number(val) * (this.token?.pricePerToken || 0)).toFixed(2));
        this.cd.markForCheck();
      });

    this.iotaControl.valueChanges
      .pipe(
        filter(() => !this.isAmountInput),
        untilDestroyed(this),
      )
      .subscribe((val: string) => {
        this.amountControl.setValue((Number(val) / (this.token?.pricePerToken || 0)).toFixed(2));
        this.cd.markForCheck();
      });
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public goToToken(): void {
    this.router.navigate([
      '/',
      ROUTER_UTILS.config.member.root,
      this.auth.member$.value?.uid,
      ROUTER_UTILS.config.member.tokens,
    ]);
    this.reset();
    this.wenOnClose.next();
  }

  public getEndDate(): dayjs.Dayjs {
    return dayjs(this.token?.saleStartDate?.toDate()).add(this.token?.saleLength || 0, 'ms');
  }

  public get descriptionItemTypes(): typeof DescriptionItemType {
    return DescriptionItemType;
  }

  public reset(): void {
    this.isOpen = false;
    this.currentStep = StepType.CONFIRM;
    this.cd.markForCheck();
  }

  public get stepType(): typeof StepType {
    return StepType;
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

  public async proceedWithOrder(): Promise<void> {
    if (!this.token || !this.agreeTermsConditions) {
      return;
    }

    const params: any = {
      token: this.token.uid,
    };

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.orderApi.orderToken(sc), $localize`Order created.`, finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
        });
    });
  }

  public getDecimalsPerNetwork(v?: Network): number {
    return NETWORK_DETAIL[v || DEFAULT_NETWORK].divideBy;
  }

  public getTargetAmount(): number {
    return this.amountControl.value * (this.token?.pricePerToken || 0);
  }

  public getResultAmount(): number {
    return this.isAmountInput
      ? this.amountControl.value * (this.token?.pricePerToken || 0)
      : this.amountControl.value * Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals));
  }

  public ngOnDestroy(): void {
    this.transSubscription?.unsubscribe();
  }
}
