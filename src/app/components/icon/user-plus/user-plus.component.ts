import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-user-plus',
  templateUrl: './user-plus.component.html',
  styleUrls: ['./user-plus.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPlusIconComponent {
  @Input() size = 24;
}
