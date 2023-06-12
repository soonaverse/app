import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-angle-right',
  templateUrl: './angle-right.component.html',
  styleUrls: ['./angle-right.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngleRightIconComponent {
  @Input() size = 24;
}
