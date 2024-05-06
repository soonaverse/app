import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DescriptionItemType } from '@components/description/description.component';
import { UnitsService } from '@core/services/units';
import { DataService } from '@pages/token/services/data.service';
import { HelperService } from '@pages/token/services/helper.service';
import { Token, TokenDistribution, TokenStatus } from '@buildcore/interfaces';
import dayjs from 'dayjs';

@Component({
  selector: 'wen-token-progress',
  templateUrl: './token-progress.component.html',
  styleUrls: ['./token-progress.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenProgressComponent {
  @Input() token?: Token;
  @Input() memberDistribution?: TokenDistribution;
  public openTokenRefund?: TokenDistribution | null;
  public tokenActionTypeLabel = $localize`Refund`;
  public descriptionLabels = [
    $localize`Your Deposit`,
    $localize`Potential Tokens`,
    $localize`Token Owned`,
    $localize`Total Deposit`,
    $localize`Total Participants`,
  ];

  constructor(
    public data: DataService,
    public helper: HelperService,
    public unitsService: UnitsService,
  ) {}

  public getCountdownDate(): Date {
    return dayjs(this.token?.saleStartDate?.toDate())
      .add(this.token?.saleLength || 0, 'ms')
      .toDate();
  }

  public get descriptionItemTypes(): typeof DescriptionItemType {
    return DescriptionItemType;
  }

  public getCountdownTitle(): string {
    return $localize`Sale ends in`;
  }

  public isPreMinted(): boolean {
    return this.token?.status === TokenStatus.PRE_MINTED;
  }

  public getCountdownStartDate(): Date {
    return dayjs(this.token?.saleStartDate?.toDate()).toDate();
  }

  public getCountdownCooldownDate(): Date {
    return dayjs(this.token?.coolDownEnd?.toDate()).toDate();
  }

  public getInProgressTitle(): string {
    if (this.helper.isInCooldown(this.token)) {
      return $localize`Cooldown in progress`;
    } else {
      return $localize`Sale in progress`;
    }
  }

  public getCountdownTitleStart(): string {
    return $localize`Sale starts in`;
  }

  public getCountdownCoolDownTitleStart(): string {
    return $localize`Cooldown ends in`;
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

  public getPotentialTokens(): number {
    if (!this.memberDistribution?.totalDeposit) {
      return 0;
    }

    return (this.memberDistribution?.totalDeposit || 0) / (this.token?.pricePerToken || 0);
  }

  public getTotalPotentialTokens(): number {
    if (!this.token?.totalDeposit) {
      return 0;
    }

    return (this.token?.totalDeposit || 0) / (this.token?.pricePerToken || 0);
  }

  public getPrc(): number {
    const prc = this.getTotalPotentialTokens() / this.getPublicSaleSupply();
    return (prc > 1 ? 1 : prc) * 100;
  }
}
