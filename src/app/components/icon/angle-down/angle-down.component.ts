import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-angle-down',
  templateUrl: './angle-down.component.html',
  styleUrls: ['./angle-down.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngleDownIconComponent {
  @Input() size = 24;
}
