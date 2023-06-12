import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-collapse-arrow',
  templateUrl: './collapse-arrow.component.html',
  styleUrls: ['./collapse-arrow.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapseArrowIconComponent {
  @Input() size = 24;
}
