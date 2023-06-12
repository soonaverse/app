import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { ThemeService } from '@core/services/theme';
import { Observable } from 'rxjs';
import { NavigationService } from './@core/services/navigation/navigation.service';

@Component({
  selector: 'wen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WenComponent implements OnInit, AfterViewInit, OnDestroy {
  public isLoggedIn$!: Observable<boolean>;
  private observer?: MutationObserver;

  constructor(
    private themeService: ThemeService,
    private cacheService: CacheService,
    private authService: AuthService,
    private navigation: NavigationService,
    private deviceService: DeviceService,
    private seo: SeoService,
  ) {}

  public ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.runGlobalServices();
    this.navigation.watchPathHistory();
    this.seo.setTags();
    this.cacheService.listenToUsdPrices();
  }

  public ngAfterViewInit(): void {
    this.setOverflowForModals();
  }

  private runGlobalServices(): void {
    this.themeService.init();
  }

  private setOverflowForModals(): void {
    if (this.deviceService.isBrowser) {
      this.observer = new MutationObserver(() => {
        const htmlElement = document.querySelector('html');
        const modalMask = document.querySelector('.ant-modal-mask');
        htmlElement!.style.overflowY = modalMask ? 'hidden' : 'auto';
      });
      this.observer.observe(document.querySelector('.cdk-overlay-container') as Node, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }
  }

  public ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
