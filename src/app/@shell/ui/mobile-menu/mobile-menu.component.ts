import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Wallets } from '@components/auth/services/auth.service';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { FILE_SIZES, Member } from '@buildcore/interfaces';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'wen-mobile-menu',
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMenuComponent {
  // TODO Clean up this passing around of inputs. This messy.
  @Input() isVisible = false;
  @Input() isMemberProfile = false;
  @Input() isLandingPage = false;
  @Input() filesizes!: typeof FILE_SIZES;
  @Input() enableCreateAwardProposal = true;
  @Output() isVisibleChanged = new EventEmitter<boolean>();

  constructor(public auth: AuthService, private router: Router) {}

  wenOnVisibleChange(isVisible: boolean): void {
    this.isVisible = isVisible;
    this.isVisibleChanged.emit(isVisible);
  }

  public get isLoggedIn$(): BehaviorSubject<boolean> {
    return this.auth.isLoggedIn$;
  }

  public get member$(): BehaviorSubject<Member | undefined> {
    return this.auth.member$;
  }

  public onClickProfile(w: Wallets): void {
    if (!this.auth.isLoggedIn$.value) {
      this.auth.signIn(w).then((res) => {
        // Only redirect to dashboard if home.
        if (this.router.url === '/' && res) {
          this.router.navigate([ROUTER_UTILS.config.base.dashboard]);
          this.wenOnVisibleChange(false);
        }
      });
    }
  }

  public onClickProfileMetamask(): void {
    this.onClickProfile(Wallets.Metamask);
  }

  public onClickProfileTanglePay(): void {
    this.onClickProfile(Wallets.TanglePay);
  }
}
