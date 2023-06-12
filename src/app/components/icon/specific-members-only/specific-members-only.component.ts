import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-specific-members-only',
  templateUrl: './specific-members-only.component.html',
  styleUrls: ['./specific-members-only.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecificMembersOnlyIconComponent {
  @Input() size = 24;
}
