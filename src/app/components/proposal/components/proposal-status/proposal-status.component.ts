import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Milestone, PROPOSAL_COMMENCING_IN_DAYS, Proposal } from '@build-5/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, map, skip } from 'rxjs';
import { MilestoneApi } from './../../../../@api/milestone.api';

@UntilDestroy()
@Component({
  selector: 'wen-proposal-status',
  templateUrl: './proposal-status.component.html',
  styleUrls: ['./proposal-status.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalStatusComponent implements OnInit {
  @Input() proposal?: Proposal | null;
  public lastMilestone$: BehaviorSubject<Milestone | undefined> = new BehaviorSubject<
    Milestone | undefined
  >(undefined);

  constructor(private milestoneApi: MilestoneApi, private cd: ChangeDetectorRef) {
    // none.
  }

  public ngOnInit(): void {
    this.milestoneApi
      .top(undefined, 1)
      ?.pipe(
        untilDestroyed(this),
        map((o: Milestone[]) => {
          return o[0];
        }),
      )
      .subscribe(this.lastMilestone$);

    this.lastMilestone$.pipe(skip(1), untilDestroyed(this)).subscribe(() => {
      this.cd.markForCheck();
    });
  }

  public isComplete(): boolean {
    if (!this.proposal) {
      return false;
    }

    return (
      dayjs(this.proposal.settings.endDate.toDate()).isBefore(dayjs()) && !this.proposal.rejected
    );
  }

  public isInProgress(): boolean {
    if (!this.proposal || this.proposal.rejected) {
      return false;
    }

    return !this.isComplete() && !this.isCommencing() && !!this.proposal.approved;
  }

  public isPending(): boolean {
    return (
      !this.isCommencing() && !this.isInProgress() && !this.isComplete() && !this.proposal?.rejected
    );
  }

  public isCommencing(): boolean {
    if (!this.proposal || !this.proposal.approved || this.proposal.rejected) {
      return false;
    }

    return (
      dayjs(this.proposal.settings.startDate.toDate())
        .subtract(PROPOSAL_COMMENCING_IN_DAYS, 'd')
        .isBefore(dayjs()) &&
      dayjs(this.proposal.settings.startDate.toDate()).isAfter(dayjs()) &&
      !this.isComplete()
    );
  }
}
