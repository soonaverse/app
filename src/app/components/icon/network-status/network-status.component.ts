import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-network-status',
  templateUrl: './network-status.component.html',
  styleUrls: ['./network-status.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkStatusIconComponent {
  @Input() size = 24;
}
