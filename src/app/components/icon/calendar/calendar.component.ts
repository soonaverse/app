import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-icon-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarIconComponent {}
