import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/proposal/services/helper.service';
import { Proposal, StakeType, Timestamp } from '@build-5/interfaces';
import dayjs from 'dayjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, Observable, Subscription, interval, map } from 'rxjs';
import { ProposalApi } from './../../../../@api/proposal.api';
import { NotificationService } from './../../../../@core/services/notification/notification.service';
import { DataService } from './../../services/data.service';

@UntilDestroy()
@Component({
  selector: 'wen-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.less'],
})
export class OverviewPage implements OnInit {
  public voteControl: FormControl = new FormControl();
  public startDateTicker$: BehaviorSubject<Timestamp>;

  public isModalOpen = false;

  constructor(
    private auth: AuthService,
    private notification: NotificationService,
    private nzNotification: NzNotificationService,
    private proposalApi: ProposalApi,
    private seo: SeoService,
    public data: DataService,
    public helper: HelperService,
    public deviceService: DeviceService,
  ) {
    // Init start date.
    this.startDateTicker$ = new BehaviorSubject<Timestamp>(
      this.data.proposal$.value?.settings?.startDate || Timestamp.now(),
    );
  }

  public ngOnInit(): void {
    this.data.currentMembersVotes$.pipe(untilDestroyed(this)).subscribe((tran) => {
      if (tran?.[0]?.payload?.values && tran?.[0]?.payload?.values?.length > 0) {
        // TODO Deal with multiple answers.
        tran?.[0]?.payload?.values.forEach((v: number) => {
          this.voteControl.setValue(v);
        });
      }
    });

    this.data.proposal$.pipe(untilDestroyed(this)).subscribe((p) => {
      this.startDateTicker$.next(p?.settings?.startDate || Timestamp.now());

      this.seo.setTags(
        $localize`Proposal - ` + p?.name || '',
        $localize`See all participants within the award.`,
        this.data.space$.value?.bannerUrl,
      );
    });

    // Run ticker.
    const int: Subscription = interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.startDateTicker$.next(this.startDateTicker$.value);

        // If it's in the past.
        if (
          this.startDateTicker$.value &&
          dayjs(this.startDateTicker$.value.toDate()).isBefore(dayjs())
        ) {
          int.unsubscribe();
          this.data.proposal$.next(<Proposal>{ ...this.data.proposal$.value });
        }
      });
  }

  public get isLoggedIn$(): BehaviorSubject<boolean> {
    return this.auth.isLoggedIn$;
  }

  public closeVoteModal(): void {
    this.isModalOpen = false;
  }

  public openVoteModal(): void {
    this.isModalOpen = true;
  }

  public get loggedInUserTotalStake$(): Observable<number> {
    return this.data.tokenDistribution$.pipe(
      map((v) => {
        return (
          (v?.stakes?.[StakeType.DYNAMIC]?.amount || 0) +
          (v?.stakes?.[StakeType.STATIC]?.amount || 0)
        );
      }),
    );
  }

  public async vote(): Promise<void> {
    if (this.helper.isNativeVote(this.data.proposal$.value?.type)) {
      this.openVoteModal();
      return;
    }

    if (!this.data.proposal$.value?.uid) {
      return;
    }

    if (!(this.voteControl.value > -1)) {
      this.nzNotification.error('', 'Please select option first!');
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.proposal$.value.uid,
        values: [this.voteControl.value],
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.proposalApi.vote(sc), 'Voted.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }
}
