import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-iota',
  templateUrl: './iota.component.html',
  styleUrls: ['./iota.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IotaIconComponent {
  @Input() size = 24;
}
