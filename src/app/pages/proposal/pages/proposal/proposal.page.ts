import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AwardApi } from '@api/award.api';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/proposal/services/helper.service';
import {
  Award,
  FILE_SIZES,
  GLOBAL_DEBOUNCE_TIME,
  Proposal,
  ProposalType,
} from '@build-5/interfaces';
import { BehaviorSubject, debounceTime, first, firstValueFrom, skip, Subscription } from 'rxjs';
import { MemberApi } from './../../../../@api/member.api';
import { ProposalApi } from './../../../../@api/proposal.api';
import { SpaceApi } from './../../../../@api/space.api';
import { NavigationService } from './../../../../@core/services/navigation/navigation.service';
import { NotificationService } from './../../../../@core/services/notification/notification.service';
import { DataService as ProposalDataService } from './../../services/data.service';

@UntilDestroy()
@Component({
  selector: 'wen-proposal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './proposal.page.html',
  styleUrls: ['./proposal.page.less'],
})
export class ProposalPage implements OnInit, OnDestroy {
  public sections = [
    { route: [ROUTER_UTILS.config.proposal.overview], label: $localize`Overview` },
    { route: [ROUTER_UTILS.config.proposal.votes], label: $localize`Votes` },
  ];
  public isGuardianWithinSpace$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isProposaslInfoVisible = false;
  private subscriptions$: Subscription[] = [];
  private guardiansSubscription$?: Subscription;
  private currentMemberVotedTransSubscription$?: Subscription;
  private canVoteSubscription$?: Subscription;
  private proposalId?: string;

  constructor(
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService,
    private spaceApi: SpaceApi,
    private tokenApi: TokenApi,
    private route: ActivatedRoute,
    private proposalApi: ProposalApi,
    private memberApi: MemberApi,
    private awardApi: AwardApi,
    private cd: ChangeDetectorRef,
    public data: ProposalDataService,
    public helper: HelperService,
    public previewImageService: PreviewImageService,
    public nav: NavigationService,
    public deviceService: DeviceService,
  ) {
    // none.
  }

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);
    this.route.params?.pipe(untilDestroyed(this)).subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.proposal.proposal.replace(':', '')];
      if (id) {
        this.listenToProposal(id);
      } else {
        this.notFound();
      }
    });

    // If we're unable to find the space we take the user out as well.
    this.data.proposal$
      .pipe(skip(1), untilDestroyed(this), debounceTime(GLOBAL_DEBOUNCE_TIME))
      .subscribe((obj: Proposal | undefined) => {
        if (!obj) {
          this.notFound();
          return;
        }

        // Once we load proposal let's load guardians for the space.
        this.guardiansSubscription$?.unsubscribe();

        if (this.auth.member$.value?.uid) {
          this.guardiansSubscription$ = this.spaceApi
            .isGuardianWithinSpace(obj.space, this.auth.member$.value.uid)
            .pipe(untilDestroyed(this))
            .subscribe(this.isGuardianWithinSpace$);
        }

        if (obj.type !== ProposalType.NATIVE && this.sections.length === 2) {
          this.sections.push({
            route: [ROUTER_UTILS.config.proposal.participants],
            label: $localize`Participants`,
          });
          this.sections = [...this.sections];
          this.cd.markForCheck();
        }
      });

    // Guardians might be refreshed alter and we need to apply that on view.
    this.data.guardians$.subscribe(() => {
      this.cd.markForCheck();
    });

    // Once we get proposal get space/badges/token.
    this.data.proposal$.pipe(skip(1), first()).subscribe(async (p) => {
      if (p) {
        this.subscriptions$.push(
          this.spaceApi.listen(p.space).pipe(untilDestroyed(this)).subscribe(this.data.space$),
        );
        if (p.createdBy) {
          this.subscriptions$.push(
            this.memberApi
              .listen(p.createdBy)
              .pipe(untilDestroyed(this))
              .subscribe(this.data.creator$),
          );
        }

        if (p.token) {
          this.subscriptions$.push(
            this.tokenApi.listen(p.token).pipe(untilDestroyed(this)).subscribe(this.data.token$),
          );

          if (this.auth.member$.value?.uid) {
            this.subscriptions$.push(
              this.tokenApi
                .getMembersDistribution(p.token, this.auth.member$.value.uid)
                .subscribe(this.data.tokenDistribution$),
            );
          }
        }

        // Get badges to show.
        const awards: Award[] = [];
        if (p.settings?.awards?.length) {
          for (const a of p.settings.awards) {
            const award: Award | undefined = await firstValueFrom(this.awardApi.listen(a));
            if (award) {
              awards.push(award);
            }
          }
        }

        this.data.badges$.next(awards);
      }
    });

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((member) => {
      this.currentMemberVotedTransSubscription$?.unsubscribe();
      this.canVoteSubscription$?.unsubscribe();
      if (member?.uid && this.proposalId) {
        this.currentMemberVotedTransSubscription$ = this.proposalApi
          .getMembersVotes(this.proposalId, member.uid)
          .subscribe(this.data.currentMembersVotes$);
        this.currentMemberVotedTransSubscription$ = this.proposalApi
          .canMemberVote(this.proposalId, member.uid)
          .subscribe(this.data.canVote$);
      } else {
        this.data.currentMembersVotes$.next(undefined);
        this.data.canVote$.next(false);
      }
    });
  }

  public fireflyNotSupported(): void {
    alert('Firefly deep links does not support this option yet. Use CLI wallet instead.');
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  private notFound(): void {
    this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
  }

  private listenToProposal(id: string): void {
    this.proposalId = id;
    this.cancelSubscriptions();
    this.subscriptions$.push(
      this.proposalApi.listen(id).pipe(untilDestroyed(this)).subscribe(this.data.proposal$),
    );
    this.subscriptions$.push(
      this.proposalApi.lastVotes(id).pipe(untilDestroyed(this)).subscribe(this.data.transactions$),
    );
  }

  public trackByUid(index: number, item: Award) {
    return item.uid;
  }

  public async approve(): Promise<void> {
    if (!this.data.proposal$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.proposal$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.proposalApi.approve(sc), 'Approved.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public async reject(): Promise<void> {
    if (!this.data.proposal$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.proposal$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.proposalApi.reject(sc), 'Rejected.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  private cancelSubscriptions(): void {
    this.currentMemberVotedTransSubscription$?.unsubscribe();
    this.canVoteSubscription$?.unsubscribe();
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
    this.data.resetSubjects();
    this.guardiansSubscription$?.unsubscribe();
  }
}
