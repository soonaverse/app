import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.less'],
  selector: 'wen-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  constructor(public auth: AuthService) {
    // none.
  }
}
