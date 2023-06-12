import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-refresh',
  templateUrl: './refresh.component.html',
  styleUrls: ['./refresh.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefreshIconComponent {
  @Input() size = 24;
}
