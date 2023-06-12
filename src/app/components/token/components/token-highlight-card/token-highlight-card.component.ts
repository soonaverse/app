import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { TokenMarketApi } from '@api/token_market.api';
import { TokenPurchaseApi } from '@api/token_purchase.api';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Token } from '@soonaverse/interfaces';
import { BehaviorSubject, Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-token-highlight-card',
  templateUrl: './token-highlight-card.component.html',
  styleUrls: ['./token-highlight-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenHighlightCardComponent implements OnDestroy {
  @Input() title = '';

  @Input()
  set tokens(value: Token[]) {
    this._tokens = value;
    this.listenToStats();
  }

  get tokens(): Token[] {
    return this._tokens;
  }

  @Input() toDetail = true;

  public listenAvgPrice: BehaviorSubject<number | undefined>[] = [];
  public listenChangePrice24h: BehaviorSubject<number | undefined>[] = [];

  private _tokens: Token[] = [];
  private subscriptions$: Subscription[] = [];

  constructor(
    public previewImageService: PreviewImageService,
    public unitsService: UnitsService,
    private tokenPurchaseApi: TokenPurchaseApi,
    private tokenMarketApi: TokenMarketApi,
  ) {}

  private listenToStats(): void {
    this.cancelSubscriptions();
    this.listenAvgPrice = [];
    this.listenChangePrice24h = [];
    this.tokens.forEach((token) => {
      const listenAvgPrice$ = new BehaviorSubject<number | undefined>(undefined);
      const listenChangePrice24h$ = new BehaviorSubject<number | undefined>(undefined);
      this.listenAvgPrice.push(listenAvgPrice$);
      this.listenChangePrice24h.push(listenChangePrice24h$);
      this.subscriptions$.push(
        this.tokenMarketApi
          .listenAvgPrice(token?.uid)
          .pipe(untilDestroyed(this))
          .subscribe(listenAvgPrice$),
      );
      this.subscriptions$.push(
        this.tokenPurchaseApi
          .listenChangePrice24h(token?.uid)
          .pipe(untilDestroyed(this))
          .subscribe(listenChangePrice24h$),
      );
    });
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
