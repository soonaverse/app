import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeIconComponent {
  @Input() size = 24;
}
