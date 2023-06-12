import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletIconComponent {
  @Input() size = 24;
}
