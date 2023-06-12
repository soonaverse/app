import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@components/auth/services/auth.service';
import { ROUTER_UTILS } from '@core/utils/router.utils';

@Component({
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  returnUrl: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
  ) {
    this.returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl') ||
      `/${ROUTER_UTILS.config.base.home}`;
  }

  onClickSignIn(): void {
    this.authService.signIn();
    this.router.navigate([this.returnUrl]);
  }
}
