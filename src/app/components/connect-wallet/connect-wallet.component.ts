import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';

@Component({
  selector: 'wen-connect-wallet',
  templateUrl: './connect-wallet.component.html',
  styleUrls: ['./connect-wallet.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectWalletComponent {
  @Input() wrapperClass = '';

  constructor(public auth: AuthService) {}
}
