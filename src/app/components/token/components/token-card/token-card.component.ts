import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { DataService } from '@pages/token/services/data.service';
import { HelperService } from '@pages/token/services/helper.service';
import { Token } from '@build-5/interfaces';
import dayjs from 'dayjs';

export enum TokenCardType {
  UPCOMING = 0,
  ONGOING = 1,
  ENDING = 2,
  COOLDOWN = 3,
}

@Component({
  selector: 'wen-token-card',
  templateUrl: './token-card.component.html',
  styleUrls: ['./token-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenCardComponent {
  @Input()
  set token(value: Token | undefined) {
    this._token = value;
    this.setCardType();
  }

  get token(): Token | undefined {
    return this._token;
  }

  public cardType = TokenCardType.UPCOMING;
  public path = ROUTER_UTILS.config.token.root;
  private _token?: Token;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public data: DataService,
    public helper: HelperService,
    private cd: ChangeDetectorRef,
  ) {}

  public get tokenCardTypes(): typeof TokenCardType {
    return TokenCardType;
  }

  public getStartDate(): dayjs.Dayjs {
    return dayjs(this.token?.saleStartDate?.toDate());
  }

  public getCooldownDate(): dayjs.Dayjs {
    return dayjs(this.token?.coolDownEnd?.toDate());
  }

  public getEndDate(): dayjs.Dayjs {
    return dayjs(this.token?.saleStartDate?.toDate()).add(this.token?.saleLength || 0, 'ms');
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

  private setCardType(): void {
    const endDate = this.getEndDate();
    // 1 / 5 is close to ending.
    if (
      dayjs(this.token?.saleStartDate?.toDate()).isBefore(dayjs()) &&
      endDate
        .clone()
        .subtract((this.token?.saleLength || 0) / 5)
        .isBefore(dayjs()) &&
      endDate.isAfter(dayjs())
    ) {
      this.cardType = TokenCardType.ENDING;
    } else if (
      dayjs(this.token?.saleStartDate?.toDate()).isBefore(dayjs()) &&
      endDate.isAfter(dayjs())
    ) {
      this.cardType = TokenCardType.ONGOING;
    } else if (
      endDate.isBefore(dayjs()) &&
      dayjs(this.token?.coolDownEnd?.toDate()).isAfter(dayjs())
    ) {
      this.cardType = TokenCardType.COOLDOWN;
    } else {
      this.cardType = TokenCardType.UPCOMING;
    }
    this.cd.markForCheck();
  }
}
