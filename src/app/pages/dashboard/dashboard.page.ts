import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { ThemeList, ThemeService } from '@core/services/theme';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Award, Proposal, Space } from '@buildcore/interfaces';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MemberApi } from './../../@api/member.api';

@UntilDestroy()
@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit, OnDestroy {
  public spaces$: BehaviorSubject<Space[] | undefined> = new BehaviorSubject<Space[] | undefined>(
    undefined,
  );
  public pendingSpaces$: BehaviorSubject<Space[] | undefined> = new BehaviorSubject<
    Space[] | undefined
  >(undefined);
  public proposals$: BehaviorSubject<Proposal[] | undefined> = new BehaviorSubject<
    Proposal[] | undefined
  >(undefined);
  public awards$: BehaviorSubject<Award[] | undefined> = new BehaviorSubject<Award[] | undefined>(
    undefined,
  );
  private subscriptions$: Subscription[] = [];
  public theme = ThemeList;
  path = ROUTER_UTILS.config.base;

  constructor(
    private auth: AuthService,
    private memberApi: MemberApi,
    public themeService: ThemeService,
    public deviceService: DeviceService,
  ) {
    // none.
  }

  public ngOnInit(): void {
    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((o) => {
      this.cancelSubscriptions();
      if (o?.uid) {
        this.subscriptions$.push(this.memberApi.topSpaces(o.uid).subscribe(this.spaces$));
        this.subscriptions$.push(
          this.memberApi.pendingSpaces(o.uid).subscribe(this.pendingSpaces$),
        );
        this.subscriptions$.push(this.memberApi.topProposals(o.uid).subscribe(this.proposals$));
        this.subscriptions$.push(this.memberApi.topAwardsPending(o.uid).subscribe(this.awards$));
      }
    });
    this.deviceService.viewWithSearch$.next(true);
  }

  public onClickChangeTheme(theme: ThemeList): void {
    this.themeService.setTheme(theme);
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public isLoading(arr: any): boolean {
    return arr === undefined;
  }

  public isEmpty(arr: any): boolean {
    return Array.isArray(arr) && arr.length === 0;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
    this.spaces$.next(undefined);
    this.pendingSpaces$.next(undefined);
    this.proposals$.next(undefined);
    this.awards$.next(undefined);
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
