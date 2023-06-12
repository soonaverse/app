import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuditOneAttribute, AuditOneResponse } from '../../services/query.service';
@Component({
  selector: 'wen-audit-one-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  @Input() public entity?: string;
  @Input() public dataset?: AuditOneResponse | null;
  @Input() public canManage?: boolean;
  @Output() wenOnClose = new EventEmitter<void>();

  public close(): void {
    this.wenOnClose.next();
  }

  public getFilterModal(): AuditOneAttribute[] {
    if (!this.dataset?.attributes) {
      return [];
    }

    return this.dataset.attributes;
  }
}
