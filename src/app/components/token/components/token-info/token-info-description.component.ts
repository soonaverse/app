import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { TokenApi } from '@api/token.api';
import { DescriptionItemType } from '@components/description/description.component';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { download } from '@core/utils/tools.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/token/services/data.service';
import { HelperService } from '@pages/token/services/helper.service';
import { QUERY_MAX_LENGTH, Token, TokenDistribution } from '@buildcore/interfaces';
import Papa from 'papaparse';
import { debounceTime } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-token-info-description',
  templateUrl: './token-info-description.component.html',
  styleUrls: ['./token-info-description.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenInfoDescriptionComponent {
  @Input() token?: Token;

  public tokenInfoLabels: string[] = [
    $localize`Icon`,
    $localize`Name`,
    $localize`Symbol`,
    $localize`Decimals`,
    $localize`Launchpad Price`,
    $localize`Network`,
    $localize`Total supply`,
    $localize`Current distribution`,
    $localize`Type`,
  ];

  constructor(
    public data: DataService,
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public unitsService: UnitsService,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
  ) {}

  public get descriptionItemTypes(): typeof DescriptionItemType {
    return DescriptionItemType;
  }

  public async downloadCurrentDistribution(): Promise<void> {
    const distributions = await this.tokenApi.getAllDistributions(this.token?.uid);
    const fields = [
      '',
      'NetworkAddress',
      'tokenOwned',
      'unclaimedTokens',
      'tokenClaimed',
      'lockedForSale',
      'sold',
      'totalBought',
      'refundedAmount',
      'totalPaid',
      'totalDeposit',
    ];

    const csv = Papa.unparse({
      fields,
      data:
        distributions?.map((d) => [
          d.uid,
          d.tokenOwned,
          d.totalUnclaimedAirdrop || 0,
          d.tokenClaimed,
          d.lockedForSale,
          d.sold,
          d.totalBought,
          d.refundedAmount,
          d.totalPaid,
          d.totalDeposit,
        ]) || [],
    });

    download(
      `data:text/csv;charset=utf-8${csv}`,
      `soonaverse_${this.token?.symbol}_distribution.csv`,
    );
    this.cd.markForCheck();
  }
}
