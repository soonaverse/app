import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-members-with-badge',
  templateUrl: './members-with-badge.component.html',
  styleUrls: ['./members-with-badge.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersWithBadgeIconComponent {
  @Input() size = 24;
}
