import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DescriptionItemType } from '@components/description/description.component';
import { PreviewImageService } from '@core/services/preview-image';
import { DataService } from '@pages/token/services/data.service';
import { HelperService } from '@pages/token/services/helper.service';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

@Component({
  selector: 'wen-token-info',
  templateUrl: './token-info.component.html',
  styleUrls: ['./token-info.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenInfoComponent {
  public tokenScheduleLabels: string[] = [
    $localize`Sale starts`,
    $localize`Sale ends`,
    $localize`Cooldown ends`,
  ];

  constructor(
    public previewImageService: PreviewImageService,
    public data: DataService,
    public helper: HelperService,
  ) {}

  public get descriptionItemTypes(): typeof DescriptionItemType {
    return DescriptionItemType;
  }
}
