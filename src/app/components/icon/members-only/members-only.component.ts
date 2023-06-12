import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-members-only',
  templateUrl: './members-only.component.html',
  styleUrls: ['./members-only.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersOnlyIconComponent {
  @Input() size = 24;
}
