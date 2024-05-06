import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Proposal } from '@buildcore/interfaces';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ProposalFilter } from './../../../../@api/proposal.api';
import { DataService } from './../../services/data.service';

@UntilDestroy()
@Component({
  selector: 'wen-proposals',
  templateUrl: './proposals.page.html',
  styleUrls: ['./proposals.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalsPage implements OnInit, OnDestroy {
  public spaceId?: string;
  public selectedListControl: FormControl = new FormControl(ProposalFilter.ACTIVE);
  public hotTags: { value: ProposalFilter; label: string }[] = [
    { value: ProposalFilter.DRAFT, label: $localize`Pending` },
    { value: ProposalFilter.ACTIVE, label: $localize`Active` },
    { value: ProposalFilter.COMPLETED, label: $localize`Completed` },
    { value: ProposalFilter.REJECTED, label: $localize`Rejected` },
  ];
  private subscriptions$: Subscription[] = [];

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private seo: SeoService,
    public data: DataService,
    public deviceService: DeviceService,
  ) {}

  public ngOnInit(): void {
    this.route.parent?.params.subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.space.space.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.spaceId = id;

        this.seo.setTags(
          $localize`Space - Proposals`,
          $localize`Space's proposals`,
          this.data.space$.value?.bannerUrl,
        );
      } else {
        this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
      }
    });

    this.data.guardians$.pipe(untilDestroyed(this)).subscribe(() => {
      this.cd.markForCheck();
    });

    this.selectedListControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      if (this.spaceId && val === ProposalFilter.COMPLETED) {
        this.data.listenToCompletedProposals(this.spaceId);
      } else if (this.spaceId && val === ProposalFilter.DRAFT) {
        this.data.listenToDraftProposals(this.spaceId);
      } else if (this.spaceId && val === ProposalFilter.REJECTED) {
        this.data.listenToRejectedProposals(this.spaceId);
      }
      this.cd.markForCheck();
    });
  }

  public getList(): BehaviorSubject<Proposal[] | undefined> {
    if (this.selectedListControl.value === this.filterOptions.ACTIVE) {
      return this.data.proposalsActive$;
    } else if (this.selectedListControl.value === this.filterOptions.DRAFT) {
      return this.data.proposalsDraft$;
    } else if (this.selectedListControl.value === this.filterOptions.REJECTED) {
      return this.data.proposalsRejected$;
    } else {
      return this.data.proposalsCompleted$;
    }
  }

  public getTitle(): string {
    if (this.selectedListControl.value === this.filterOptions.ACTIVE) {
      return 'Active';
    } else {
      return 'Completed';
    }
  }

  public get filterOptions(): typeof ProposalFilter {
    return ProposalFilter;
  }

  public create(): void {
    this.router.navigate([
      '/' + ROUTER_UTILS.config.proposal.root,
      ROUTER_UTILS.config.proposal.newProposal,
      { space: this.spaceId },
    ]);
  }

  public handleFilterChange(filter: ProposalFilter): void {
    this.selectedListControl.setValue(filter);
    this.cd.markForCheck();
  }

  public trackByUid(index: number, item: Proposal) {
    return item.uid;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
