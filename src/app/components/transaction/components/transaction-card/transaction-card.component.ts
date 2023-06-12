import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { Transaction } from '@build-5/interfaces';

@Component({
  selector: 'wen-transaction-card',
  templateUrl: './transaction-card.component.html',
  styleUrls: ['./transaction-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionCardComponent {
  @Input() transaction!: Transaction;

  constructor(
    public previewImageService: PreviewImageService,
    public deviceService: DeviceService,
    public transactionService: TransactionService,
    public unitsService: UnitsService,
  ) {}
}
