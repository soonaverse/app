import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/award/services/helper.service';
import { COL, GLOBAL_DEBOUNCE_TIME, Member } from '@soonaverse/interfaces';
import { BehaviorSubject, debounceTime, first, from, skip, Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AwardApi, AwardParticipantWithMember } from './../../../../@api/award.api';
import { DEFAULT_LIST_SIZE } from './../../../../@api/base.api';
import { NotificationService } from './../../../../@core/services/notification/notification.service';
import { AuthService } from './../../../../components/auth/services/auth.service';

enum FilterOptions {
  PENDING = 'pending',
  ISSUED = 'issued',
}

@UntilDestroy()
@Component({
  selector: 'wen-participants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './participants.page.html',
  styleUrls: ['./participants.page.less'],
})
export class ParticipantsPage implements OnInit, OnDestroy {
  public awardId?: string;
  public selectedListControl: FormControl = new FormControl(FilterOptions.PENDING);
  public pendingParticipants$: BehaviorSubject<AwardParticipantWithMember[] | undefined> =
    new BehaviorSubject<AwardParticipantWithMember[] | undefined>(undefined);
  public issuedParticipants$: BehaviorSubject<AwardParticipantWithMember[] | undefined> =
    new BehaviorSubject<AwardParticipantWithMember[] | undefined>(undefined);
  public search$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(
    undefined,
  );
  public filterControl: FormControl = new FormControl(undefined);
  public overTenRecords = false;
  public hotTags: { value: FilterOptions; label: string }[] = [
    { value: FilterOptions.PENDING, label: $localize`Pending` },
    { value: FilterOptions.ISSUED, label: $localize`Issued` },
  ];
  public static DEBOUNCE_TIME = GLOBAL_DEBOUNCE_TIME;
  private subscriptions$: Subscription[] = [];
  private dataStorePending: AwardParticipantWithMember[][] = [];
  private dataStoreIssued: AwardParticipantWithMember[][] = [];

  constructor(
    private auth: AuthService,
    private awardApi: AwardApi,
    public readonly algoliaService: AlgoliaService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private cd: ChangeDetectorRef,
    private seo: SeoService,
    public data: DataService,
    public helper: HelperService,
    public deviceService: DeviceService,
    public cache: CacheService,
  ) {
    // none.
  }

  public ngOnInit(): void {
    this.route.parent?.params.subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.award.award.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.awardId = id;

        this.seo.setTags(
          $localize`Award -`,
          $localize`See all participants within the award.`,
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

    this.search$.pipe(skip(1), untilDestroyed(this)).subscribe((val) => {
      // We need reset old values.
      this.resetParticipantsList();
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
            this.onScroll(ids.slice(0, 10));
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

  public onScroll(searchIds?: string[]): void {
    if (!this.awardId) {
      return;
    }

    this.onParticipantScroll(this.awardId, this.selectedListControl.value, searchIds);
  }

  public onParticipantScroll(awardId: string, list: FilterOptions, searchIds?: string[]): void {
    let store;
    let handler;
    let stream;
    if (list === FilterOptions.PENDING) {
      store = this.dataStorePending;
      stream = this.pendingParticipants$.value;
      handler = this.listenPendingParticipant;
    } else {
      store = this.dataStoreIssued;
      stream = this.issuedParticipants$.value;
      handler = this.listenIssuedParticipant;
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
    const lastValue = stream ? stream[stream.length - 1].participatedOn : undefined;
    handler.call(this, awardId, lastValue, searchIds);
  }

  public listenPendingParticipant(awardId: string, lastValue?: any, searchIds?: string[]): void {
    this.subscriptions$.push(
      this.awardApi
        .listenPendingParticipants(awardId, lastValue, searchIds)
        .subscribe(
          this.store.bind(
            this,
            this.pendingParticipants$,
            this.dataStorePending,
            this.dataStorePending.length,
          ),
        ),
    );
  }

  public listenIssuedParticipant(awardId: string, lastValue?: any, searchIds?: string[]): void {
    this.subscriptions$.push(
      this.awardApi
        .listenIssuedParticipants(awardId, lastValue, searchIds)
        .subscribe(
          this.store.bind(
            this,
            this.issuedParticipants$,
            this.dataStoreIssued,
            this.dataStoreIssued.length,
          ),
        ),
    );
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

  public async approve(memberId: string): Promise<void> {
    const id: string | undefined = this.data.award$?.value?.uid;
    if (!id) {
      return;
    }

    await this.auth.sign(
      {
        award: id,
        members: [memberId],
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.awardApi.approveParticipant(sc), 'Approve.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public handleFilterChange(filter: FilterOptions): void {
    this.selectedListControl.setValue(filter);
    this.cd.markForCheck();
  }

  public get filterOptions(): typeof FilterOptions {
    return FilterOptions;
  }

  public getList(): BehaviorSubject<AwardParticipantWithMember[] | undefined> {
    if (this.selectedListControl.value === this.filterOptions.PENDING) {
      return this.pendingParticipants$;
    } else {
      return this.issuedParticipants$;
    }
  }

  public getMemberCreatedOnLabel(): string {
    return $localize`applied on`;
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  private resetParticipantsList(): void {
    this.dataStorePending = [];
    this.dataStoreIssued = [];
    this.pendingParticipants$.next(undefined);
    this.issuedParticipants$.next(undefined);
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });

    this.resetParticipantsList();
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
