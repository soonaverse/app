import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Timestamp } from '@build-5/interfaces';
import dayjs from 'dayjs';
@Component({
  selector: 'wen-date-tag',
  templateUrl: './date-tag.component.html',
  styleUrls: ['./date-tag.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTagComponent {
  @Input() public title = $localize`Ends`;
  @Input() public date?: dayjs.Dayjs | Timestamp | null;
}
