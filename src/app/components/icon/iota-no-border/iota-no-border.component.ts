import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-iota-no-border',
  templateUrl: './iota-no-border.component.html',
  styleUrls: ['./iota-no-border.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IotaNoBorderIconComponent {
  @Input() size = 24;
}
