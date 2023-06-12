import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnitsService } from '@core/services/units';
import { DataService } from '@pages/award/services/data.service';
import { HelperService } from '@pages/award/services/helper.service';
import { FILE_SIZES } from '@build-5/interfaces';

@Component({
  selector: 'wen-award-awards',
  templateUrl: './award-awards.component.html',
  styleUrls: ['./award-awards.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwardAwardsComponent {
  public isCsvBadgeModalOpen = false;
  constructor(
    public data: DataService,
    public unitsService: UnitsService,
    public helper: HelperService,
  ) {}

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }
}
