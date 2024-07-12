import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@components/auth/services/auth.service';
import { ResizeAvatarPipe } from '@core/pipes/resize-avatar/resize-avatar.pipe';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FILE_SIZES, Member } from '@buildcore/interfaces';
import { BehaviorSubject, Subscription, filter, map, skip } from 'rxjs';
import { MemberApi } from './../../../../@api/member.api';
import { NavigationService } from './../../../../@core/services/navigation/navigation.service';
import { DataService } from './../../services/data.service';

@UntilDestroy()
@Component({
  templateUrl: './member.page.html',
  styleUrls: ['./member.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberPage implements OnInit, OnDestroy {
  public memberId = '';
  public sections: Array<{ route: string; label: string }> = [];
  public isAboutMemberVisible = false;
  public height$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  @ViewChild('sidebar') private sidebar?: ElementRef;
  private subscriptions$: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private memberApi: MemberApi,
    private auth: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private seo: SeoService,
    private resizeAvatar: ResizeAvatarPipe,
    public nav: NavigationService,
    public data: DataService,
    public deviceService: DeviceService,
  ) {
    // none.
  }

  ngOnInit() {
    this.deviceService.viewWithSearch$.next(false);
    this.route.params.subscribe((params) => {
      this.cancelSubscriptions();
      if (params?.memberId) {
        this.listenMember(params.memberId);
        this.sections = [
          // { route: 'badges', label: $localize`Reputation` },
          // { route: 'awards', label: $localize`Awards` },
          // { route: 'spaces', label: $localize`Spaces` },
          // { route: 'tokens', label: $localize`Tokens` },
          // { route: 'nfts', label: $localize`NFTs` },
        ];
        this.checkLoggedInTabs();
        this.cd.markForCheck();
      } else {
        this.notFound();
      }
    });

    // If we're unable to find the space we take the user out as well.
    this.data.member$.pipe(skip(1), untilDestroyed(this)).subscribe((obj) => {
      if (!obj) {
        this.notFound();
      }

      this.seo.setTags(
        $localize`Member -`,
        undefined,
        this.resizeAvatar.transform(obj?.avatar, FILE_SIZES.large),
      );

      this.data.loadServiceModuleData();
    });

    this.auth.member$.pipe(untilDestroyed(this)).subscribe(() => {
      this.checkLoggedInTabs();
    });
  }

  @HostListener('window:scroll', ['$event'])
  public track() {
    this.height$.next(this.sidebar?.nativeElement.scrollHeight || 0);
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  private notFound(): void {
    this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
  }

  public listenMember(memberId: string): void {
    const isValidMemberId = typeof memberId === 'string' && /[a-zA-Z0-9]/.test(memberId);

    if (!isValidMemberId) {
      this.data.awardsCompleted$.next([]);
      this.data.awardsPending$.next([]);
      this.data.space$.next([]);
      this.data.member$.next(undefined);
      return;
    }

    this.subscriptions$.push(
      this.memberApi
        .topAwardsCompleted(memberId)
        .pipe(untilDestroyed(this))
        .subscribe(this.data.awardsCompleted$),
    );
    this.subscriptions$.push(
      this.memberApi
        .topAwardsPending(memberId)
        .pipe(untilDestroyed(this))
        .subscribe(this.data.awardsPending$),
    );
    // TODO Implement search. This is parked since we will be implementing new search here.
    this.subscriptions$.push(
      this.memberApi
        .topSpaces(memberId)
        .pipe(
          untilDestroyed(this),
          map((spaces) =>
            spaces.filter(
              (space) => space && typeof space.uid === 'string' && space.uid.trim() !== '',
            ),
          ),
        )
        .subscribe((filteredSpaces) => {
          this.data.space$.next(filteredSpaces);
        }),
    );
    this.subscriptions$.push(
      this.memberApi
        .listen(memberId)
        .pipe(
          untilDestroyed(this),
          filter((v) => v && typeof v.uid === 'string' && v.uid.trim() !== ''),
        )
        .subscribe((validMember) => {
          // Only pass next stage if valid.
          this.data.member$.next(validMember);
        }),
    );

    // Continue with other actions if memberId is valid.
    this.data.refreshBadges();
  }

  public get loggedInMember$(): BehaviorSubject<Member | undefined> {
    return this.auth.member$;
  }

  private checkLoggedInTabs() {
    if (this.auth.member$.getValue()?.uid === this.route.snapshot.params.memberId) {
      if (!this.sections.find((s) => s.route === 'transactions')) {
        this.sections = [
          { route: 'activity', label: $localize`Activity` },
          ...this.sections,
          { route: 'transactions', label: $localize`Transactions` },
        ];
      }
      this.cd.markForCheck();
    }
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
    this.data.resetSubjects();
  }
}
