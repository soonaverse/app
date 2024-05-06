import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MemberApi } from '@api/member.api';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { COL, GLOBAL_DEBOUNCE_TIME, Member } from '@buildcore/interfaces';
import { BehaviorSubject, Subscription, debounceTime, first, from, skip } from 'rxjs';
import { DataService } from '../../services/data.service';
import { DEFAULT_LIST_SIZE } from './../../../../@api/base.api';
import { ProposalApi, ProposalParticipantWithMember } from './../../../../@api/proposal.api';
import { ROUTER_UTILS } from './../../../../@core/utils/router.utils';

enum ParticipantFilterOptions {
  PENDING = 'pending',
  VOTED = 'voted',
}

@UntilDestroy()
@Component({
  selector: 'wen-participants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './participants.page.html',
  styleUrls: ['./participants.page.less'],
})
export class ParticipantsPage implements OnInit, OnDestroy {
  public search$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(
    undefined,
  );
  public filterControl: FormControl = new FormControl(undefined);
  public overTenRecords = false;
  public static DEBOUNCE_TIME = GLOBAL_DEBOUNCE_TIME;
  public selectedListControl: FormControl = new FormControl(ParticipantFilterOptions.PENDING);
  public membersPending$: BehaviorSubject<ProposalParticipantWithMember[] | undefined> =
    new BehaviorSubject<ProposalParticipantWithMember[] | undefined>(undefined);
  public membersVoted$: BehaviorSubject<ProposalParticipantWithMember[] | undefined> =
    new BehaviorSubject<ProposalParticipantWithMember[] | undefined>(undefined);
  public hotTags: { value: ParticipantFilterOptions; label: string }[] = [
    { value: ParticipantFilterOptions.PENDING, label: $localize`Pending Vote` },
    { value: ParticipantFilterOptions.VOTED, label: $localize`Voted` },
  ];
  private dataStorePendingMembers: ProposalParticipantWithMember[][] = [];
  private dataStoreVotedMembers: ProposalParticipantWithMember[][] = [];
  private subscriptions$: Subscription[] = [];
  private proposalId?: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public readonly algoliaService: AlgoliaService,
    private cd: ChangeDetectorRef,
    private memberApi: MemberApi,
    private proposalApi: ProposalApi,
    private seo: SeoService,
    public data: DataService,
    public deviceService: DeviceService,
    public cache: CacheService,
  ) {
    // none.
  }

  public get filterOptions(): typeof ParticipantFilterOptions {
    return ParticipantFilterOptions;
  }

  public ngOnInit(): void {
    this.route.parent?.params.subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.proposal.proposal.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.proposalId = id;

        this.seo.setTags(
          $localize`Proposal - Participants`,
          $localize`See all participants within the proposal`,
          this.data.space$.value?.bannerUrl,
        );
      } else {
        this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
      }
    });

    this.selectedListControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.search$.value && this.search$.value.length > 0) {
        this.search$.next(this.search$.value);
      } else {
        this.onScroll();
      }
      this.cd.markForCheck();
    });

    this.search$.pipe(skip(1), untilDestroyed(this)).subscribe(async (val) => {
      // We need reset old values.
      this.resetDataStore();
      this.resetSubjects();
      this.overTenRecords = false;
      if (val && val.length > 0) {
        from(
          this.algoliaService.searchClient
            .initIndex(COL.MEMBER)
            .search(val || '', { length: 5, offset: 0 }),
        )
          .pipe(first())
          .subscribe((r) => {
            const ids: string[] = r.hits.map((r) => {
              const member = r as unknown as Member;
              return member.uid;
            });

            // Top 10 records only supported
            this.overTenRecords = ids.length > 10;
            this.onScroll();
          });
      } else {
        // Show normal list again.
        this.onScroll();
      }
    });

    this.filterControl.valueChanges
      .pipe(debounceTime(ParticipantsPage.DEBOUNCE_TIME))
      .subscribe(this.search$);

    // Load initial list.
    this.onScroll();
  }

  public handleFilterChange(filter: ParticipantFilterOptions): void {
    this.selectedListControl.setValue(filter);
    this.cd.markForCheck();
  }

  public getList(): BehaviorSubject<ProposalParticipantWithMember[] | undefined> {
    if (this.selectedListControl.value === this.filterOptions.VOTED) {
      return this.membersVoted$;
    } else {
      return this.membersPending$;
    }
  }

  public getMemberCreatedOnLabel(): string {
    return $localize`joined soonaverse on`;
  }

  public getTitle(): string {
    if (this.selectedListControl.value === this.filterOptions.VOTED) {
      return $localize`Voted`;
    } else {
      return $localize`Pending`;
    }
  }

  public isPendingList(): boolean {
    return this.selectedListControl.value === this.filterOptions.PENDING;
  }

  public onScroll(): void {
    if (!this.proposalId) {
      return;
    }

    this.onParticipantScroll(this.proposalId, this.selectedListControl.value);
  }

  protected store(
    stream$: BehaviorSubject<any[] | undefined>,
    store: any[][],
    page: number,
    a: any,
  ): void {
    if (store[page]) {
      store[page] = a;
    } else {
      store.push(a);
    }

    // Merge arrays.
    stream$.next(Array.prototype.concat.apply([], store));
  }

  public onParticipantScroll(proposalId: string, list: ParticipantFilterOptions): void {
    let store;
    let handler;
    let stream;
    if (list === ParticipantFilterOptions.VOTED) {
      store = this.dataStoreVotedMembers;
      stream = this.membersVoted$.value;
      handler = this.listenVotedMembers;
    } else {
      store = this.dataStorePendingMembers;
      stream = this.membersPending$.value;
      handler = this.listenPendingMembers;
    }

    // Make sure we allow initial load store[0]
    if (
      store[0] &&
      (!store[store.length - 1] || store[store.length - 1]?.length < DEFAULT_LIST_SIZE)
    ) {
      // Finished paging.
      return;
    }

    // For initial load stream will not be defiend.
    const lastValue = stream ? stream[stream.length - 1]._issuedOn : undefined;
    handler.call(this, proposalId, lastValue);
  }

  public listenVotedMembers(proposalId: string, lastValue?: any): void {
    this.subscriptions$.push(
      this.proposalApi
        .listenVotedMembers(proposalId, lastValue)
        .subscribe(
          this.store.bind(
            this,
            this.membersVoted$,
            this.dataStoreVotedMembers,
            this.dataStoreVotedMembers.length,
          ),
        ),
    );
  }

  public listenPendingMembers(proposalId: string, lastValue?: string): void {
    this.subscriptions$.push(
      this.proposalApi
        .listenPendingMembers(proposalId, lastValue)
        .subscribe(
          this.store.bind(
            this,
            this.membersPending$,
            this.dataStorePendingMembers,
            this.dataStorePendingMembers.length,
          ),
        ),
    );
  }

  public trackByUid(index: number, item: ProposalParticipantWithMember) {
    return item.uid;
  }

  public resetDataStore(): void {
    this.dataStorePendingMembers = [];
    this.dataStoreVotedMembers = [];
  }

  private resetSubjects(): void {
    this.membersPending$.next(undefined);
    this.membersVoted$.next(undefined);
  }

  private cancelSubscriptions(): void {
    this.resetSubjects();
    this.resetDataStore();
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
