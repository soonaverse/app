import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { copyToClipboard } from '@core/utils/tools.utils';

@Component({
  selector: 'wen-send-funds',
  templateUrl: './send-funds.component.html',
  styleUrls: ['./send-funds.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendFundsComponent {
  @Input() public formattedAmount?: string | null;
  @Input() public targetAddress?: string;
  @Input() public targetText?: string;
  public isCopied = false;

  constructor(private cd: ChangeDetectorRef) {
    // none.
  }

  public copyAddress() {
    if (!this.isCopied && this.targetAddress) {
      copyToClipboard(this.targetAddress);
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
        this.cd.markForCheck();
      }, 3000);
    }
  }
}
