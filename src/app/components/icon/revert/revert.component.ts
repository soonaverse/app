import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-revert',
  templateUrl: './revert.component.html',
  styleUrls: ['./revert.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevertIconComponent {
  @Input() size = 24;
}
