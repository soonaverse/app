import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchIconComponent {
  @Input() size = 24;
}
