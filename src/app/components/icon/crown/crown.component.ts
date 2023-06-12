import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-crown',
  templateUrl: './crown.component.html',
  styleUrls: ['./crown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrownIconComponent {
  @Input() size = 24;
}
