import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FileApi } from '@api/file.api';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { RouterService } from '@core/services/router';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { download } from '@core/utils/tools.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService, SpaceAction } from '@pages/space/services/data.service';
import {
  FILE_SIZES,
  Member,
  SOON_SPACE,
  SOON_SPACE_TEST,
  Space,
  StakeType,
  TokenDistribution,
} from '@soonaverse/interfaces';
import Papa from 'papaparse';
import { BehaviorSubject, combineLatest, debounceTime, map, Observable, skip } from 'rxjs';
import { SpaceApi } from './../../../../@api/space.api';
import { NavigationService } from './../../../../@core/services/navigation/navigation.service';
import { NotificationService } from './../../../../@core/services/notification/notification.service';

@UntilDestroy()
@Component({
  selector: 'wen-space',
  templateUrl: './space.page.html',
  styleUrls: ['./space.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpacePage implements OnInit, OnDestroy {
  public sections = [
    { route: 'overview', label: $localize`About` },
    { route: 'collections', label: $localize`Collections` },
    { route: 'proposals', label: $localize`Proposals` },
    { route: 'awards', label: $localize`Awards` },
    { route: 'members', label: $localize`Members` },
  ];
  public isAboutSpaceVisible = false;
  public exportingCurrentStakers = false;
  public isRewardScheduleVisible = false;
  private guardianSection = { route: 'manage', label: $localize`Manage` };
  constructor(
    private auth: AuthService,
    private spaceApi: SpaceApi,
    private tokenApi: TokenApi,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public data: DataService,
    public unitsService: UnitsService,
    public nav: NavigationService,
    public deviceService: DeviceService,
    public routerService: RouterService,
  ) {
    // none.
  }

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);
    this.route.params?.pipe(untilDestroyed(this)).subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.space.space.replace(':', '')];
      if (id) {
        this.data.listenToSpace(id);
        this.data.listenToTokens(id);
      } else {
        this.notFound();
      }
    });

    this.data.triggerAction$.pipe(skip(1), untilDestroyed(this)).subscribe((s) => {
      if (s === SpaceAction.EXPORT_CURRENT_STAKERS && this.data.token$.value?.uid) {
        this.exportCurrentStakers(this.data.token$.value?.uid);
      } else if (s === SpaceAction.STAKING_REWARD_SCHEDULE) {
        this.isRewardScheduleVisible = true;
        this.cd.markForCheck();
      }
    });

    // If we're unable to find the space we take the user out as well.
    this.data.space$.pipe(skip(1), untilDestroyed(this)).subscribe((obj) => {
      if (!obj) {
        this.notFound();
      }
    });

    this.data.isGuardianWithinSpace$.pipe(untilDestroyed(this)).subscribe((b) => {
      if (b && this.sections.indexOf(this.guardianSection) === -1) {
        this.sections.push(this.guardianSection);
        this.sections = [...this.sections];
        this.cd.markForCheck();
      } else if (!b && this.sections.indexOf(this.guardianSection) > -1) {
        this.sections.splice(this.sections.indexOf(this.guardianSection), 1);
        this.sections = [...this.sections];
        this.cd.markForCheck();
      }
    });

    let loadedListenToMembers = false;
    const subs = this.data.token$.pipe(skip(1), untilDestroyed(this)).subscribe((obj) => {
      if (obj) {
        this.data.listenToTokenStatus(obj.uid);
        // TODO Deal with log in.
        if (this.auth.member$.value?.uid) {
          loadedListenToMembers = true;
          this.data.listenToMembersDistribution(obj.uid, this.auth.member$.value.uid);
        }
        subs.unsubscribe();
      }
    });

    this.auth.member$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (!loadedListenToMembers) {
        if (val?.uid && this.data.token$.value?.uid) {
          loadedListenToMembers = true;
          this.data.listenToMembersDistribution(this.data.token$.value?.uid, val.uid);
        }
      }
    });
  }

  private notFound(): void {
    this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
  }

  public get member$(): BehaviorSubject<Member | undefined> {
    return this.auth.member$;
  }

  public get avatarUrl$(): Observable<string | undefined> {
    return this.data.space$.pipe(
      map((space: Space | undefined) => {
        return space?.avatarUrl ? FileApi.getUrl(space.avatarUrl, FILE_SIZES.small) : undefined;
      }),
    );
  }

  public exportCurrentStakers(token: string): void {
    // In progress.
    if (this.exportingCurrentStakers) {
      return;
    }

    this.exportingCurrentStakers = true;
    this.tokenApi
      .getDistributions(token)
      .pipe(debounceTime(2500), untilDestroyed(this))
      .subscribe((transactions: TokenDistribution[] | undefined) => {
        if (!transactions) {
          return;
        }

        this.exportingCurrentStakers = false;
        const fields = [
          '',
          'memberId',
          'tokenStakedDynamic',
          'tokenStakedStatic',
          'stakedValueDynamic',
          'stakedValueStatic',
          'totalStakeRewards',
        ];
        const csv = Papa.unparse({
          fields,
          data: transactions.map((t) => [
            t.uid,
            t.stakes?.[StakeType.DYNAMIC]?.amount || 0,
            t.stakes?.[StakeType.STATIC]?.amount || 0,
            t.stakes?.[StakeType.DYNAMIC]?.value || 0,
            t.stakes?.[StakeType.STATIC]?.value || 0,
            t.stakeRewards || 0,
          ]),
        });

        download(`data:text/csv;charset=utf-8${csv}`, `soonaverse_${token}_stakers.csv`);
        this.cd.markForCheck();
      });
  }

  public get bannerUrl$(): Observable<string | undefined> {
    return this.data.space$.pipe(
      map((space: Space | undefined) => {
        return space?.bannerUrl ? FileApi.getUrl(space.bannerUrl, FILE_SIZES.large) : undefined;
      }),
    );
  }

  public async join(): Promise<void> {
    if (!this.data.space$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.space$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(
            this.spaceApi.join(sc),
            this.data.space$.value?.open ? 'Joined.' : 'Pending Approval',
            finish,
          )
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public userStakedEnoughToJoin$(): Observable<boolean> {
    return combineLatest([this.data.tokenDistribution$, this.data.space$]).pipe(
      map(([v, s]) => {
        return (v?.stakes?.[StakeType.DYNAMIC]?.value || 0) >= (s?.minStakedValue || 0);
      }),
    );
  }

  public edit(): void {
    if (!this.data.space$.value?.uid) {
      return;
    }

    this.router.navigate([
      ROUTER_UTILS.config.space.root,
      ROUTER_UTILS.config.space.edit,
      {
        spaceId: this.data.space$.value.uid,
      },
    ]);
  }

  public isSoonSpace(): Observable<boolean> {
    return this.data.space$.pipe(
      map((s) => {
        return s?.uid === (environment.production ? SOON_SPACE : SOON_SPACE_TEST);
      }),
    );
  }

  public async leave(): Promise<void> {
    if (!this.data.space$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.space$.value.uid,
      },
      (sc, finish) => {
        this.notification.processRequest(this.spaceApi.leave(sc), 'Left.', finish).subscribe(() => {
          // none
        });
      },
    );
  }

  public ngOnDestroy(): void {
    this.data.cancelSubscriptions();
  }
}
