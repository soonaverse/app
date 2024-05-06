import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TokenApi } from '@api/token.api';
import { TokenMarketApi } from '@api/token_market.api';
import { TokenPurchaseApi } from '@api/token_purchase.api';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import { DEFAULT_NETWORK_DECIMALS, Token, TokenStatus } from '@buildcore/interfaces';
import { BehaviorSubject, Subscription, first } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-token-all-token-row',
  templateUrl: './token-all-token-row.component.html',
  styleUrls: ['./token-all-token-row.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenAllTokenRowComponent implements OnInit, OnDestroy {
  @Input() tokenId?: string;
  public token?: Token;
  public path = ROUTER_UTILS.config.token.root;
  public tradePath = ROUTER_UTILS.config.token.trade;
  public listenAvgPrice$: BehaviorSubject<number | undefined> = new BehaviorSubject<
    number | undefined
  >(undefined);
  public listenVolume24h$: BehaviorSubject<number | undefined> = new BehaviorSubject<
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
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    if (this.tokenId) {
      this.tokenApi
        .listen(this.tokenId)
        .pipe(untilDestroyed(this))
        .subscribe((token: any) => {
          if (token) {
            this.token = token;
            if (this.token?.uid) {
              this.listenToStats(this.token.uid);
            }
            this.cd.markForCheck();
          }
        });
    }
  }

  private listenToStats(tokenId: string): void {
    this.cancelSubscriptions();
    // TODO Add pagging.
    this.subscriptions$.push(
      this.tokenMarketApi
        .listenAvgPrice(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenAvgPrice$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenVolume24h(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenVolume24h$),
    );
    this.subscriptions$.push(
      this.tokenPurchaseApi
        .listenChangePrice24h(tokenId)
        .pipe(untilDestroyed(this))
        .subscribe(this.listenChangePrice24h$),
    );
  }

  public getDefaultNetworkDecimals(): number {
    return DEFAULT_NETWORK_DECIMALS;
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

  public tradable(): boolean {
    return (
      this.token?.status === TokenStatus.PRE_MINTED ||
      this.token?.status === TokenStatus.MINTED ||
      this.token?.status === TokenStatus.BASE
    );
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public getTokenRoute(): string[] {
    if (this.tradable()) {
      return ['/', this.path, this.token!.uid, this.tradePath];
    } else {
      return ['/', this.path, this.token!.uid];
    }
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
