import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { DeviceService, LAYOUT_CHANGE_DEBOUNCE_TIME } from '@core/services/device';
import { RouterService } from '@core/services/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'wen-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
  public showSideBar$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor(
    private router: Router,
    private deviceService: DeviceService,
    public routerService: RouterService,
  ) {}

  public ngOnInit(): void {
    combineLatest([this.router.events, this.deviceService.isMobile$])
      .pipe(
        untilDestroyed(this),
        debounceTime(LAYOUT_CHANGE_DEBOUNCE_TIME),
        filter(([event]: [any, boolean]) => {
          return (
            !event?.routerEvent ||
            event.routerEvent instanceof NavigationEnd ||
            event.routerEvent instanceof NavigationCancel
          );
        }),
      )
      .subscribe(() => {
        if (this.deviceService.isMobile$.getValue()) {
          this.showSideBar$.next(false);
        } else {
          this.showSideBar$.next(true);
        }
      });
  }
}
