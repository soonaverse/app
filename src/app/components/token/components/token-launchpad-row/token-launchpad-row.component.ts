import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TokenApi } from '@api/token.api';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/token/services/helper.service';
import { Token, TokenStatus } from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { first, Subscription } from 'rxjs';
import { TokenCardType } from '../token-card/token-card.component';

@UntilDestroy()
@Component({
  selector: 'wen-token-launchpad-row',
  templateUrl: './token-launchpad-row.component.html',
  styleUrls: ['./token-launchpad-row.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenLaunchpadRowComponent implements OnInit, OnDestroy {
  @Input() tokenId?: string;
  public token?: Token;
  public path = ROUTER_UTILS.config.token.root;
  private subscriptions$: Subscription[] = [];

  constructor(
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public deviceService: DeviceService,
    public unitsService: UnitsService,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    if (this.tokenId) {
      this.tokenApi
        .listen(this.tokenId)
        .pipe(first(), untilDestroyed(this))
        .subscribe((token) => {
          if (token) {
            this.token = token;
            this.cd.markForCheck();
          }
        });
    }
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

  public getPrc(): number {
    const prc =
      (this.token?.totalDeposit || 0) /
      (this.token?.pricePerToken || 0) /
      this.getPublicSaleSupply();
    return (prc > 1 ? 1 : prc) * 100;
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

  public getCardType(): TokenCardType | undefined {
    const endDate = this.getEndDate();
    // 1 / 5 is close to ending.
    let cardType;
    if (endDate.isBefore(dayjs()) && dayjs(this.token?.coolDownEnd?.toDate()).isAfter(dayjs())) {
      cardType = TokenCardType.ENDING;
    } else if (
      dayjs(this.token?.saleStartDate?.toDate()).isBefore(dayjs()) &&
      endDate.isAfter(dayjs())
    ) {
      cardType = TokenCardType.ONGOING;
    }
    return cardType;
  }

  public get tokenCardTypes(): typeof TokenCardType {
    return TokenCardType;
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
