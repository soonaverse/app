import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';

@Component({
  selector: 'wen-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  // No need to inject NftSelectionService or maintain selectedCount$
  constructor(
    public auth: AuthService,
  ) {

  }
}
