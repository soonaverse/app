import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AuditOneResponse } from '../../services/query.service';

@Component({
  selector: 'wen-audit-one-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetComponent {
  @Input() public entity?: string;
  @Input() public canManage?: boolean;
  public isAuditOneModalOpen = false;
  @Input() public dataset?: AuditOneResponse | null;
  constructor(public cd: ChangeDetectorRef) {}

  public openAuditOneModal() {
    this.isAuditOneModalOpen = true;
    this.cd.markForCheck();
  }

  public closeAuditOneModal(): void {
    this.isAuditOneModalOpen = false;
    this.cd.markForCheck();
  }
}
