import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { OrderApi } from '@api/order.api';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import {
  MIN_IOTA_AMOUNT,
  Token,
  TokenPurchase,
  TokenTradeOrder,
  TokenTradeOrderType,
  TOKEN_SALE,
  TOKEN_SALE_TEST,
  Transaction,
} from '@build-5/interfaces';
import { BehaviorSubject, combineLatest, map, Observable, Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-token-trade-detail-modal',
  templateUrl: './token-trade-detail-modal.component.html',
  styleUrls: ['./token-trade-detail-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenTradeDetailModalComponent implements OnDestroy {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() token?: Token;

  @Input()
  set tradeDetailOrder(value: TokenTradeOrder | undefined) {
    this._tradeDetailOrder = value;
    this.creditTransactions$ = [];
    this.creditSubscriptions$?.unsubscribe();
    if (value?.creditTransactionId) {
      const tempSellerCreditTransaction$ = new BehaviorSubject<Transaction | undefined>(undefined);
      this.subscriptions$.push(
        this.orderApi
          .listen(value.creditTransactionId)
          .pipe(untilDestroyed(this))
          .subscribe(tempSellerCreditTransaction$),
      );
      this.creditTransactions$.push(tempSellerCreditTransaction$);
    }
  }

  get tradeDetailOrder(): TokenTradeOrder | undefined {
    return this._tradeDetailOrder;
  }

  @Input()
  set tradeDetailPurchases(value: TokenPurchase[] | TokenPurchase) {
    if (!(value instanceof Array)) {
      value = [value];
    }
    this._tradeDetailPurchases = value;
    this.cancelSubscriptions();
    this.tradeDetailPurchases.forEach((purchase) => {
      const { billPaymentId, buyerBillPaymentId, royaltyBillPayments } = purchase;
      if (billPaymentId) {
        const tempBillPaymentTransaction$ = new BehaviorSubject<Transaction | undefined>(undefined);
        this.subscriptions$.push(
          this.orderApi
            .listen(billPaymentId)
            .pipe(untilDestroyed(this))
            .subscribe(tempBillPaymentTransaction$),
        );
        this.billPaymentTransactions$.push(tempBillPaymentTransaction$);
      }
      if (buyerBillPaymentId) {
        const tempBuyerBillPaymentTransaction$ = new BehaviorSubject<Transaction | undefined>(
          undefined,
        );
        this.subscriptions$.push(
          this.orderApi
            .listen(buyerBillPaymentId)
            .pipe(untilDestroyed(this))
            .subscribe(tempBuyerBillPaymentTransaction$),
        );
        this.buyerBillPaymentTransactions$.push(tempBuyerBillPaymentTransaction$);
      }
      if (royaltyBillPayments) {
        const tempRoyalBillPaymentsTransaction$ = new BehaviorSubject<Transaction[] | undefined>(
          undefined,
        );
        this.subscriptions$.push(
          this.orderApi
            .listenMultiple(royaltyBillPayments)
            .pipe(untilDestroyed(this))
            .subscribe(tempRoyalBillPaymentsTransaction$),
        );
        this.royaltyBillPaymentsTransactions$.push(tempRoyalBillPaymentsTransaction$);
      }
    });
  }

  get tradeDetailPurchases(): TokenPurchase[] {
    return this._tradeDetailPurchases;
  }

  @Output() wenOnClose = new EventEmitter<void>();

  public billPaymentTransactions$: BehaviorSubject<Transaction | undefined>[] = [];
  public buyerBillPaymentTransactions$: BehaviorSubject<Transaction | undefined>[] = [];
  public royaltyBillPaymentsTransactions$: BehaviorSubject<Transaction[] | undefined>[] = [];
  public creditTransactions$: BehaviorSubject<Transaction | undefined>[] = [];
  public spacePath: string = ROUTER_UTILS.config.space.root;
  private creditSubscriptions$?: Subscription = undefined;
  private _isOpen = false;
  private _tradeDetailPurchases: TokenPurchase[] = [];
  private _tradeDetailOrder?: TokenTradeOrder = undefined;
  private subscriptions$: Subscription[] = [];

  constructor(
    public previewImageService: PreviewImageService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    public helper: HelperService,
    private cd: ChangeDetectorRef,
    private orderApi: OrderApi,
  ) {}

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  public getWalletStatus(tran: Transaction | undefined | null): string {
    if (tran?.ignoreWallet && Number(tran?.payload?.amount) < MIN_IOTA_AMOUNT) {
      return $localize`Non Transferable`;
    } else {
      return $localize`Processing...`;
    }
  }

  public get tokenTradeOrderTypes(): typeof TokenTradeOrderType {
    return TokenTradeOrderType;
  }

  public getFeeName(tran: Transaction | undefined | null): string {
    if (!tran) {
      return 'Fee';
    }

    const config = environment.production ? TOKEN_SALE : TOKEN_SALE_TEST;
    if (tran.space === config.spaceone) {
      return $localize`Soonaverse Fee`;
    } else if (tran.space === config.spacetwo) {
      return $localize`Exchange Fee`;
    } else {
      return 'Fee';
    }
  }

  public getFee(tran: Transaction | undefined | null, i: number): Observable<number> {
    return combineLatest([
      this.royaltyBillPaymentsTransactions$[i],
      this.buyerBillPaymentTransactions$[i],
    ]).pipe(
      map(([royalty, bill]) => {
        let total = (royalty || []).reduce((acc, act) => acc + Number(act.payload.amount), 0);
        total += Number(bill?.payload.amount);
        if (total && tran?.payload.amount) {
          return tran?.payload.amount / total;
        } else {
          return 0;
        }
      }),
    );
  }

  public getDebugInfo(tran: Transaction | undefined | null): string {
    let msg = `uid: ${tran?.uid}, tries: ${tran?.payload?.walletReference?.count}`;
    if (tran?.payload?.walletReference?.error) {
      msg += `, error: "${tran?.payload?.walletReference?.error}"`;
    }

    return msg;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
    this.creditSubscriptions$?.unsubscribe();
    this.billPaymentTransactions$ = [];
    this.buyerBillPaymentTransactions$ = [];
    this.royaltyBillPaymentsTransactions$ = [];
    this.creditTransactions$ = [];
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
