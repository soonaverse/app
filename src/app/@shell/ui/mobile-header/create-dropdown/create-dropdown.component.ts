import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';
import { RouterService } from '@core/services/router';

@Component({
  selector: 'wen-create-dropdown',
  templateUrl: './create-dropdown.component.html',
  styleUrls: ['./create-dropdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDropdownComponent {
  // TODO Clean up this passing around of inputs. This messy.
  @Input() isMemberProfile = false;
  @Input() isLandingPage = false;
  @Input() enableCreateAwardProposal = true;
  @Output() wenOnCreateClick = new EventEmitter<void>();

  constructor(public routerService: RouterService, public auth: AuthService) {}
}
