import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { TokenWithMemberDistribution } from '@api/member.api';
import { TokenMarketApi } from '@api/token_market.api';
import { TokenPurchaseApi } from '@api/token_purchase.api';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import { Token, TokenStatus } from '@build-5/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-token-row',
  templateUrl: './token-row.component.html',
  styleUrls: ['./token-row.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenRowComponent implements OnInit, OnDestroy {
  @Input() token?: TokenWithMemberDistribution | Token;
  @Input() isOwner?: boolean;
  @Output() wenOnClaim = new EventEmitter<TokenWithMemberDistribution>();
  @Output() wenOnRefund = new EventEmitter<TokenWithMemberDistribution>();
  public path = ROUTER_UTILS.config.token.root;
  public tradePath = ROUTER_UTILS.config.token.trade;
  public listenAvgPrice$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenAvgPrice7d$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenVolume24h$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenVolume7d$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenChangePrice24h$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  private subscriptions$: Subscription[] = [];

  constructor(
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public deviceService: DeviceService,
    public unitsService: UnitsService,
    private tokenPurchaseApi: TokenPurchaseApi,
    private tokenMarketApi: TokenMarketApi,
  ) {}

  public ngOnInit(): void {
    if (this.token?.uid) {
      this.listenToStats(this.token.uid);
    }
  }

  private listenToStats(tokenId: string): void {
    // TODO Add pagging.
    this.subscriptions$.push(
      this.tokenMarketApi
        .listenAvgPrice(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenAvgPrice$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenAvgPrice7d(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenAvgPrice7d$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenVolume24h(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenVolume24h$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenVolume7d(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenVolume7d$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenChangePrice24h(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenChangePrice24h$),
    );
  }

  public available(): boolean {
    return (
      dayjs(this.token?.saleStartDate?.toDate()).isBefore(dayjs()) &&
      this.token?.status === TokenStatus.AVAILABLE
    );
  }

  public saleNotStarted(): boolean {
    return dayjs(this.token?.saleStartDate?.toDate()).isAfter(dayjs());
  }

  public getEndDate(): dayjs.Dayjs {
    return dayjs(this.token?.saleStartDate?.toDate()).add(this.token?.saleLength || 0, 'ms');
  }

  public saleEnded(): boolean {
    return this.getEndDate().isBefore(dayjs());
  }

  public isInCoolDown(): boolean {
    return dayjs(this.token?.coolDownEnd?.toDate()).isAfter(dayjs()) && this.saleEnded();
  }

  public tradable(): boolean {
    return (
      this.token?.status === TokenStatus.PRE_MINTED ||
      this.token?.status === TokenStatus.MINTED ||
      this.token?.status === TokenStatus.BASE
    );
  }

  public getPublicSaleSupply(): number {
    let sup = 0;
    this.token?.allocations.forEach((b) => {
      if (b.isPublicSale) {
        sup = b.percentage / 100;
      }
    });

    return (this.token?.totalSupply || 0) * sup;
  }

  public getPrc(): number {
    const prc =
      (this.token?.totalDeposit || 0) /
      (this.token?.pricePerToken || 0) /
      this.getPublicSaleSupply();
    return (prc > 1 ? 1 : prc) * 100;
  }

  public castAsTokenWithMemberDistribution(
    token: Token | TokenWithMemberDistribution,
  ): TokenWithMemberDistribution {
    return token as TokenWithMemberDistribution;
  }

  public claim($event: MouseEvent, token: TokenWithMemberDistribution): void {
    $event.stopPropagation();
    $event.preventDefault();
    this.wenOnClaim.emit(token);
  }

  public refund($event: MouseEvent, token: TokenWithMemberDistribution): void {
    $event.stopPropagation();
    $event.preventDefault();
    this.wenOnRefund.emit(token);
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
