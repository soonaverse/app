import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-check-circle',
  templateUrl: './check-circle.component.html',
  styleUrls: ['./check-circle.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckCircleIconComponent {
  @Input() size = 24;
}
