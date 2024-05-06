import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DataService } from '@pages/award/services/data.service';
import { FILE_SIZES } from '@buildcore/interfaces';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(duration);
dayjs.extend(relativeTime);

@Component({
  selector: 'wen-award-info',
  templateUrl: './award-info.component.html',
  styleUrls: ['./award-info.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwardInfoComponent {
  public descriptionTitles: string[] = [
    $localize`Badges used / available`,
    $localize`End Date`,
    $localize`Badge lock period`,
  ];

  constructor(public data: DataService) {}

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public getDuration(ms: number): string {
    return dayjs.duration(ms, 'millisecond').humanize();
  }
}
