import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuditOneResponse } from '../../services/query.service';

@Component({
  selector: 'wen-audit-one-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input() public entity?: string;
  @Input() public dataset?: AuditOneResponse | null;
}
